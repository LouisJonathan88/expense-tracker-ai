import sys
from pathlib import Path

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from app.config import config

MIME_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}

PROMPT = """Kamu membaca foto struk atau nota berbahasa Indonesia dan mengekstrak datanya.

Aturan:
- Ambil hanya baris barang yang dibeli. Abaikan baris subtotal, total, diskon total, PPN atau pajak, service charge, metode pembayaran, tunai, kembalian, nomor struk, dan info toko.
- Tanda titik atau koma pada angka rupiah adalah pemisah ribuan, bukan desimal. Contoh "12.500" atau "12,500" menjadi 12500.
- quantity adalah jumlah barang pada baris itu, isi 1 jika tidak tertulis.
- line_total adalah jumlah harga baris itu, yaitu angka di kolom paling kanan baris tersebut (sudah mencakup quantity). Salin apa adanya, jangan dibagi atau dikali sendiri.
- Jika suatu barang punya diskon sendiri pada barisnya, kurangi dari line_total.
- expense_date berformat YYYY-MM-DD dari tanggal transaksi, null jika tidak terbaca.
- printed_subtotal adalah jumlah seluruh barang sebelum diskon total, pajak, dan service, sesuai baris subtotal atau jumlah pembelian di struk. null jika struk tidak punya baris itu.
- printed_total adalah total akhir yang dibayar, null jika tidak terbaca.
- Jangan menebak barang yang tidak terbaca, lewati barisnya.
"""


class ScannedItem(BaseModel):
    item_name: str = Field(description="Nama barang sesuai tulisan di struk")
    quantity: int = Field(description="Jumlah barang pada baris itu, 1 jika tidak tertulis")
    line_total: int = Field(description="Jumlah harga baris itu (angka kolom kanan), rupiah bulat")


class ScannedReceipt(BaseModel):
    expense_date: str | None = Field(description="Tanggal YYYY-MM-DD, null jika tidak terbaca")
    printed_subtotal: int | None = Field(description="Subtotal barang sebelum diskon total, pajak, service")
    printed_total: int | None = Field(description="Total akhir yang dibayar")
    items: list[ScannedItem]


def unit_price(item: ScannedItem) -> tuple[int, int]:
    """Kembalikan (harga_satuan, quantity). Jika tidak habis dibagi,
    simpan sebagai 1 barang supaya total tetap tepat."""
    if item.quantity >= 1 and item.line_total % item.quantity == 0:
        return item.line_total // item.quantity, item.quantity
    return item.line_total, 1


def scan(image_path: Path) -> ScannedReceipt:
    client = genai.Client(api_key=config.GEMINI_API_KEY)
    mime_type = MIME_TYPES[image_path.suffix.lower()]
    response = client.models.generate_content(
        model=config.GEMINI_MODEL,
        contents=[
            types.Part.from_bytes(data=image_path.read_bytes(), mime_type=mime_type),
            PROMPT,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ScannedReceipt,
        ),
    )
    return ScannedReceipt.model_validate_json(response.text)


if __name__ == "__main__":
    receipt = scan(Path(sys.argv[1]))
    print(f"Tanggal : {receipt.expense_date}")
    for item in receipt.items:
        price, qty = unit_price(item)
        print(f"  {item.item_name} | {qty} x {price} = {price * qty}")

    items_sum = sum(i.line_total for i in receipt.items)
    reference = (
        receipt.printed_subtotal
        if receipt.printed_subtotal is not None
        else receipt.printed_total
    )
    print()
    print(f"Jumlah semua baris barang : {items_sum}")
    print(f"Subtotal tertera          : {receipt.printed_subtotal}")
    print(f"Total tertera             : {receipt.printed_total}")
    if reference is not None:
        status = "COCOK" if items_sum == reference else f"BEDA ({items_sum - reference:+d})"
        print(f"Pemeriksaan               : {status}")