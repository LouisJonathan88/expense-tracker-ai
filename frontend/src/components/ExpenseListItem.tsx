import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type { Expense } from "@/types/expense";

export function ExpenseListItem({ expense }: { expense: Expense }) {
  const adjustment = Number(expense.adjustment);

  return (
    <li>
      <Link
        href={`/expenses/${expense.id}`}
        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-emerald-300"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium">{formatTanggal(expense.expense_date)}</p>
          <p className="truncate text-sm text-slate-500">
            {expense.items.map((i) => i.item_name).join(", ")}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-medium tabular-nums">{formatRupiah(expense.total)}</p>
          {adjustment !== 0 && (
            <Badge tone={adjustment < 0 ? "success" : "neutral"}>
              {adjustment > 0 ? "+" : ""}
              {formatRupiah(adjustment)}
            </Badge>
          )}
        </div>
      </Link>
    </li>
  );
}