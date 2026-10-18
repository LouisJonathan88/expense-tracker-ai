"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { deleteExpense } from "@/lib/client-api";

export function DeleteExpenseButton({ id }: { id: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await deleteExpense(id);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.");
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        variant="danger"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Hapus
      </Button>
      <ConfirmDialog
        open={open}
        title="Hapus pengeluaran?"
        message="Transaksi ini beserta seluruh barangnya akan dihapus dan tidak bisa dikembalikan."
        busy={busy}
        error={error}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}