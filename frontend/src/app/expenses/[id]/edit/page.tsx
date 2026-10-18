import { AppShell } from "@/components/AppShell";
import { ExpenseForm } from "@/components/ExpenseForm";
import { loadExpense } from "@/lib/expenses";
import type { ExpenseInput } from "@/types/expense";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit pengeluaran",
};

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expense = await loadExpense(id);

  const initial: ExpenseInput = {
    expense_date: expense.expense_date,
    items: expense.items.map((i) => ({
      item_name: i.item_name,
      price: Number(i.price),
      quantity: i.quantity,
    })),
    adjustment: Number(expense.adjustment),
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">Edit pengeluaran</h1>
        <p className="mt-1 text-sm text-slate-500">Ubah tanggal, barang, atau penyesuaian.</p>
        <div className="mt-6">
          <ExpenseForm expenseId={expense.id} initial={initial} />
        </div>
      </div>
    </AppShell>
  );
}