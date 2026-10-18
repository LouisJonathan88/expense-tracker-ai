import asyncio
import asyncpg
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile,Response
from app.dependencies import get_current_user_id, get_db
from app.repositories import expense_repository
from app.schemas import ExpenseIn, ExpenseOut, ScanDraft, SummaryRow, ExpensePage
from datetime import date
from typing import Literal
from app.services import receipt_scanner,exporter

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.post("", response_model=ExpenseOut, status_code=201)
async def create_expense(
    body: ExpenseIn,
    user_id: int = Depends(get_current_user_id),
    pool: asyncpg.Pool = Depends(get_db),
):
    expense_id = await expense_repository.create_expense(
        pool, user_id, body.expense_date, body.adjustment, body.items
    )
    return await expense_repository.get_expense(pool, user_id, expense_id)

@router.get("", response_model=ExpensePage)
async def list_expenses(
    start: date | None = None,
    end: date | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user_id: int = Depends(get_current_user_id),
    pool: asyncpg.Pool = Depends(get_db),
):
    results, total = await expense_repository.list_expenses(
        pool, user_id, start, end, limit, offset
    )
    return {"results": results, "total": total, "limit": limit, "offset": offset}


@router.get("/summary", response_model=list[SummaryRow])
async def summary(
    group_by: Literal["month", "day"] = "month",
    start: date | None = None,
    end: date | None = None,
    user_id: int = Depends(get_current_user_id),
    pool: asyncpg.Pool = Depends(get_db),
):
    return await expense_repository.get_summary(pool, user_id, group_by, start, end)

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post(
    "/scan",
    response_model=ScanDraft,
    dependencies=[Depends(get_current_user_id)],
)
async def scan_expense(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail="format gambar tidak didukung, gunakan JPG, PNG, atau WEBP",
        )

    image = await file.read(MAX_UPLOAD_BYTES + 1)
    if not image:
        raise HTTPException(status_code=400, detail="file kosong")
    if len(image) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="ukuran gambar maksimal 5 MB")

    try:
        receipt = await receipt_scanner.scan_receipt(image, file.content_type)
        return receipt_scanner.build_draft(receipt)
    except receipt_scanner.ScanUnavailable:
        raise HTTPException(
            status_code=503,
            detail="Layanan AI sedang sibuk. Coba lagi sebentar atau isi pengeluaran secara manual.",
        )
    except receipt_scanner.ScanFailed:
        raise HTTPException(
            status_code=422,
            detail="Struk tidak bisa dibaca. Coba foto yang lebih jelas atau isi manual.",
        )

MAX_EXPORT = 10_000
XLSX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


@router.get("/export")
async def export_expenses(
    start: date | None = None,
    end: date | None = None,
    user_id: int = Depends(get_current_user_id),
    pool: asyncpg.Pool = Depends(get_db),
):
    rows, total = await expense_repository.list_expenses(
        pool, user_id, start, end, limit=MAX_EXPORT + 1
    )
    if total > MAX_EXPORT:
        raise HTTPException(
            status_code=422,
            detail=f"Terlalu banyak transaksi untuk diekspor (maksimal {MAX_EXPORT}). Persempit rentang tanggal.",
        )

    data = [ExpenseOut.model_validate(r) for r in rows]
    # Pembuatan file bersifat CPU-bound: jalankan di thread agar event loop tidak tertahan
    content = await asyncio.to_thread(exporter.build_workbook, data)
    filename = exporter.export_filename(start, end)
    return Response(
        content=content,
        media_type=XLSX_MEDIA_TYPE,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@router.get("/{expense_id}", response_model=ExpenseOut)
async def get_expense(
    expense_id: int,
    user_id: int = Depends(get_current_user_id),
    pool: asyncpg.Pool = Depends(get_db),
):
    expense = await expense_repository.get_expense(pool, user_id, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="pengeluaran tidak ditemukan")
    return expense

@router.put("/{expense_id}", response_model=ExpenseOut)
async def update_expense(
    expense_id: int,
    body: ExpenseIn,
    user_id: int = Depends(get_current_user_id),
    pool: asyncpg.Pool = Depends(get_db),
):
    updated = await expense_repository.update_expense(
        pool, user_id, expense_id, body.expense_date, body.adjustment, body.items
    )
    if not updated:
        raise HTTPException(status_code=404, detail="pengeluaran tidak ditemukan")
    return await expense_repository.get_expense(pool, user_id, expense_id)


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(
    expense_id: int,
    user_id: int = Depends(get_current_user_id),
    pool: asyncpg.Pool = Depends(get_db),
):
    deleted = await expense_repository.delete_expense(pool, user_id, expense_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="pengeluaran tidak ditemukan")