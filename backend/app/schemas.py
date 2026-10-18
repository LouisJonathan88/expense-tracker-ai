from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator

class GoogleLoginRequest(BaseModel):
    id_token: str

class TokenResponse(BaseModel):
    access_token: str

class ExpenseItemIn(BaseModel):
    item_name: str = Field(min_length=1, max_length=255)
    price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    quantity: int = Field(default=1, ge=1)

class ExpenseIn(BaseModel):
    expense_date: date
    items: list[ExpenseItemIn] = Field(min_length=1)
    adjustment: Decimal = Field(default=Decimal("0"), max_digits=12, decimal_places=2)

    @model_validator(mode="after")
    def total_tidak_negatif(self):
        items_total = sum((i.price * i.quantity for i in self.items), Decimal(0))
        if items_total + self.adjustment < 0:
            raise ValueError("total (jumlah barang + penyesuaian) tidak boleh negatif")
        return self

class ExpenseItemOut(BaseModel):
    id: int
    item_name: str
    price: Decimal
    quantity: int
    subtotal: Decimal

class ExpenseOut(BaseModel):
    id: int
    expense_date: date
    items_total: Decimal
    adjustment: Decimal
    total: Decimal
    items: list[ExpenseItemOut]

class SummaryRow(BaseModel):
    period: date
    total: Decimal

class DraftItem(BaseModel):
    item_name: str
    price: Decimal
    quantity: int


class ScanDraft(BaseModel):
    expense_date: date
    items: list[DraftItem]
    adjustment: Decimal
    needs_review: bool
    warnings: list[str]

class ExpensePage(BaseModel):
    results: list[ExpenseOut]
    total: int
    limit: int
    offset: int