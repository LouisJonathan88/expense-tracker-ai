import { AppShell } from "@/components/AppShell";
import { NewExpenseFlow } from "@/components/NewExpenseFlow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tambah pengeluaran",
};

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">Tambah pengeluaran</h1>
        <p className="mt-1 text-sm text-slate-500">
          Foto struk atau isi manual, lalu periksa sebelum menyimpan.
        </p>
        <NewExpenseFlow startWithScan={mode === "scan"} />
      </div>
    </AppShell>
  );
}