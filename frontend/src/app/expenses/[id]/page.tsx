import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { DeleteExpenseButton } from "@/components/DeleteExpenseButton";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { loadExpense } from "@/lib/expenses";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { ArrowLeft } from "lucide-react";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expense = await loadExpense(id);
  const adjustment = Number(expense.adjustment);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-emerald-700 hover:text-emerald-800"
          aria-label="Kembali ke dashboard"
          title="Kembali ke dashboard"
        >
          <ArrowLeft size={20} />
        </Link>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold">
            {formatTanggal(expense.expense_date)}
          </h1>
          <div className="flex gap-2">
            <Link
              href={`/expenses/${expense.id}/edit`}
              className={buttonClass("secondary")}
            >
              Edit
            </Link>
            <DeleteExpenseButton id={expense.id} />
          </div>
        </div>

        <Card className="mt-6">
          <ul className="divide-y divide-slate-100">
            {expense.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 py-3 first:pt-0"
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.item_name}</p>
                  <p className="text-sm tabular-nums text-slate-500">
                    {item.quantity} × {formatRupiah(item.price)}
                  </p>
                </div>
                <p className="shrink-0 font-medium tabular-nums">
                  {formatRupiah(item.subtotal)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Jumlah barang</span>
              <span className="tabular-nums">
                {formatRupiah(expense.items_total)}
              </span>
            </div>
            {adjustment !== 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {adjustment < 0 ? "Diskon" : "Pajak, service, dan lainnya"}
                </span>
                <span
                  className={`tabular-nums ${adjustment < 0 ? "text-emerald-700" : ""}`}
                >
                  {adjustment > 0 ? "+" : ""}
                  {formatRupiah(adjustment)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 text-base font-semibold">
              <span>Total dibayar</span>
              <span className="tabular-nums">
                {formatRupiah(expense.total)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
