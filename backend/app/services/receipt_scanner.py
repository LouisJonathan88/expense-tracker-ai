import logging
from datetime import date
from decimal import Decimal

import httpx
from google import genai
from google.genai import errors, types
from pydantic import BaseModel, Field, ValidationError

from app.config import config

logger = logging.getLogger(__name__)

PROMPT = """Kamu adalah AI ahli pembaca struk belanja Indonesia. Ekstrak data belanja secara sangat teliti.

ATURAN UTAMA:
1. Perhatikan baik-baik setiap baris struk dari atas ke bawah. Pastikan `item_name` dan harga di sebelah kanannya berada pada baris horizontal yang sama agar tidak tertukar dengan baris di atas atau bawahnya.
2. `line_total` adalah angka harga total untuk baris tersebut (jika ada quantity > 1, ambil total harga baris tersebut, nanti sistem yang akan membaginya menjadi harga satuan).
3. Jika di bawah nama barang terdapat baris diskon (misal 'Disc. -X'), kurangi harga tersebut langsung ke line_total item bersangkutan.
4. `quantity`: Angka jumlah barang di sebelah kiri nama barang, 1 jika tidak tertulis.
5. `printed_total`: Ambil nilai **Total Belanja** atau **Total Pembayaran** akhir yang benar-benar dibayar setelah diskon, null jika tidak ada.
6. Jangan sampai ada harga barang yang terbaca 0 jika di struk tertulis jelas harganya.
7. `total_discount`: diskon yang tertulis di bagian bawah struk (angka positif), termasuk 'Total Disc.' jika ada. null jika tidak ada. JANGAN dikurangkan ke line_total.
8. `service_charge` dan `tax`: isi hanya jika angkanya DITAMBAHKAN ke total. Jika hanya informasi (misal baris 'DPP / PPN' setelah Total Belanja, atau 'sudah termasuk PPN'), isi null.
9. `other_charges`: donasi, sumbangan, atau pembulatan di bagian bawah struk (misal 'SEDEKAH KEMANUSIAAN'), positif jika menambah total, negatif jika mengurangi. Ini BUKAN barang, jangan masukkan ke `items`.
10. `printed_subtotal`: baris jumlah barang sebelum diskon total/service/pajak (misal 'Subtotal', 'Jumlah Pembelian', 'Total Item'), null jika tidak ada.
"""

class ScannedItem(BaseModel):
    item_name: str = Field(description="Nama barang sesuai tulisan di struk")
    quantity: int = Field(description="Jumlah barang pada baris itu, 1 jika tidak tertulis")
    line_total: int = Field(description="Jumlah total harga bersih baris itu setelah diskon, rupiah bulat")

class ScannedReceipt(BaseModel):
    expense_date: str | None = Field(description="Tanggal YYYY-MM-DD, null jika tidak terbaca")
    printed_subtotal: int | None = Field(description="Jumlah barang sebelum diskon total, service, pajak")
    total_discount: int | None = Field(description="Diskon di bagian bawah struk (positif), null jika tidak ada")
    service_charge: int | None = Field(description="Service yang ditambahkan ke total (positif), null jika tidak ada")
    tax: int | None = Field(description="Pajak yang ditambahkan ke total (positif), null jika tidak ada")
    other_charges: int | None = Field(description="Donasi/pembulatan, positif jika menambah total, negatif jika mengurangi")
    printed_total: int | None = Field(description="Total akhir yang dibayar")
    items: list[ScannedItem]

class ScanUnavailable(Exception):
    """Layanan AI sibuk atau tidak terjangkau."""

class ScanFailed(Exception):
    """Gambar tidak bisa diproses atau hasilnya tidak bisa dibaca."""

_client = genai.Client(api_key=config.GEMINI_API_KEY)


async def _generate(model: str, image: bytes, mime_type: str) -> ScannedReceipt:
    response = await _client.aio.models.generate_content(
        model=model,
        contents=[types.Part.from_bytes(data=image, mime_type=mime_type), PROMPT],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ScannedReceipt,
        ),
    )
    if not response.text:
        raise ScanFailed("respons kosong")
    try:
        return ScannedReceipt.model_validate_json(response.text)
    except ValidationError as e:
        raise ScanFailed("format respons tidak sesuai") from e


async def scan_receipt(image: bytes, mime_type: str) -> ScannedReceipt:
    models = [m for m in (config.GEMINI_MODEL, config.GEMINI_FALLBACK_MODEL) if m]
    for model in models:
        try:
            receipt = await _generate(model, image, mime_type)
            logger.info("scan struk berhasil dengan model %s", model)
            return receipt
        except (errors.ServerError, httpx.TransportError) as e:
            logger.warning("model %s tidak tersedia: %s", model, e)
        except errors.ClientError as e:
            if getattr(e, "code", None) == 429:
                logger.warning("model %s kena batas kuota: %s", model, e)
            else:
                logger.error("permintaan ke model %s ditolak: %s", model, e)
                raise ScanFailed("permintaan ditolak") from e
    raise ScanUnavailable()


def unit_price(item: ScannedItem) -> tuple[int, int]:
    """Kembalikan (harga_satuan, quantity). Jika tidak habis dibagi,
    simpan sebagai 1 barang supaya total tetap tepat."""
    if item.quantity >= 1 and item.line_total % item.quantity == 0:
        return item.line_total // item.quantity, item.quantity
    return item.line_total, 1


def _rupiah(n: int) -> str:
    return "Rp " + f"{n:,}".replace(",", ".")

def build_draft(receipt: ScannedReceipt) -> dict:
    warnings: list[str] = []

    rows: list[tuple[str, int, int]] = []
    skipped = 0
    for item in receipt.items:
        if item.line_total < 0:
            skipped += 1
            continue
        
        price, quantity = unit_price(item)
        name = item.item_name.strip()[:255] or "Barang"
        rows.append((name, price, quantity))

    if skipped:
        warnings.append(f"{skipped} baris bernilai negatif dilewati.")
    if not rows:
        raise ScanFailed("tidak ada barang yang terbaca")

    items_total = sum(price * quantity for _, price, quantity in rows)

    expense_date = None
    if receipt.expense_date:
        try:
            expense_date = date.fromisoformat(receipt.expense_date)
        except ValueError:
            pass
    if expense_date is None:
        expense_date = date.today()
        warnings.append("Tanggal di struk tidak terbaca, diisi tanggal hari ini.")

    total_discount = receipt.total_discount or 0
    subtotal = receipt.printed_subtotal

    # 1. Subtotal: cocok dengan jumlah barang bersih, atau jumlah bersih + total_discount
    if subtotal is not None and subtotal > 0:
        if abs(subtotal - items_total) <= 1000:
            pass
        elif total_discount and abs(subtotal - (items_total + total_discount)) <= 1000:
            total_discount = 0
        else:
            warnings.append(
                f"Jumlah barang ({_rupiah(items_total)}) tidak sama dengan subtotal "
                f"di struk ({_rupiah(subtotal)}). Periksa kembali daftar barang."
            )

    # 2. Adjustment = selisih ke total yang dibayar
    extracted_adj = (
        (receipt.service_charge or 0)
        + (receipt.tax or 0)
        + (receipt.other_charges or 0)
        - total_discount
    )

    if receipt.printed_total is not None and receipt.printed_total >= 0:
        adjustment = receipt.printed_total - items_total
        if abs(adjustment - extracted_adj) > 1000: 
            warnings.append(
                f"Selisih {_rupiah(adjustment)} antara barang dan total struk "
                f"tidak sepenuhnya terjelaskan oleh diskon/service/pajak. Periksa kembali."
            )
    else:
        adjustment = extracted_adj

    return {
        "expense_date": expense_date,
        "items": [
            {
                "item_name": name, 
                "price": Decimal(price), 
                "quantity": quantity
            }
            for name, price, quantity in rows
        ],
        "adjustment": Decimal(adjustment),
        "needs_review": bool(warnings),
        "warnings": warnings,
    }