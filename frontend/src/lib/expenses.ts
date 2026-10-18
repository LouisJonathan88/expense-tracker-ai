import "server-only";
import { notFound } from "next/navigation";
import { backendFetch } from "@/lib/backend";
import { isValidId } from "@/lib/validation";
import type { Expense } from "@/types/expense";

export async function loadExpense(id: string): Promise<Expense> {
  if (!isValidId(id)) notFound();

  const res = await backendFetch(`/expenses/${id}`);
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error("Gagal memuat pengeluaran.");
  return res.json();
}