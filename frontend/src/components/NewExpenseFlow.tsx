"use client";

import { useEffect, useState } from "react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ReceiptUploader } from "@/components/ReceiptUploader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { scanReceipt } from "@/lib/client-api";
import { compressImage } from "@/lib/image";
import type { ExpenseInput, ScanDraft } from "@/types/expense";

type Stage =
  | { kind: "manual" }
  | { kind: "pick" }
  | { kind: "scanning" }
  | { kind: "error"; message: string }
  | { kind: "review"; draft: ScanDraft };

function draftToInput(draft: ScanDraft): ExpenseInput {
  return {
    expense_date: draft.expense_date,
    items: draft.items.map((i) => ({
      item_name: i.item_name,
      price: Number(i.price),
      quantity: i.quantity,
    })),
    adjustment: Number(draft.adjustment),
  };
}

export function NewExpenseFlow({ startWithScan }: { startWithScan: boolean }) {
  const [stage, setStage] = useState<Stage>({
    kind: startWithScan ? "pick" : "manual",
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  // Lepaskan URL gambar lama saat diganti atau saat komponen dibuang
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleSelect(file: File) {
    setPreview(null);
    setStage({ kind: "scanning" });
    try {
      const compressed = await compressImage(file);
      setPreview(URL.createObjectURL(compressed));
      const draft = await scanReceipt(compressed);
      setFormKey((k) => k + 1);
      setStage({ kind: "review", draft });
    } catch (err) {
      setStage({
        kind: "error",
        message: err instanceof Error ? err.message : "Gagal membaca struk.",
      });
    }
  }

  if (stage.kind === "manual") {
    return (
      <div className="mt-6">
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setStage({ kind: "pick" })}
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            Scan struk
          </button>
        </div>
        <ExpenseForm />
      </div>
    );
  }

  if (stage.kind === "pick") {
    return (
      <Card className="mt-6 text-center">
        <p className="font-medium">Foto struk belanja</p>
        <p className="mt-1 text-sm text-slate-500">
          Pastikan seluruh struk terlihat jelas dan tidak buram.
        </p>
        <div className="mt-5">
          <ReceiptUploader onSelect={handleSelect} />
        </div>
        <button
          type="button"
          onClick={() => setStage({ kind: "manual" })}
          className="mt-4 text-sm text-slate-500 hover:underline"
        >
          Isi manual saja
        </button>
      </Card>
    );
  }

  if (stage.kind === "scanning") {
    return (
      <Card className="mt-6 text-center">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Foto struk"
            className="mx-auto max-h-64 rounded-lg border border-slate-200 object-contain"
          />
        )}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          Membaca struk...
        </div>
      </Card>
    );
  }

  if (stage.kind === "error") {
    return (
      <Card className="mt-6">
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {stage.message}
        </p>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => setStage({ kind: "pick" })} className="flex-1">
            Coba lagi
          </Button>
          <Button
            variant="secondary"
            onClick={() => setStage({ kind: "manual" })}
            className="flex-1"
          >
            Isi manual
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          {preview && (
            <a href={preview} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Foto struk"
                className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
              />
            </a>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium">Hasil baca struk</p>
            <p className="text-sm text-slate-500">
              Periksa dan koreksi sebelum menyimpan. Klik gambar untuk memperbesar.
            </p>
            <button
              type="button"
              onClick={() => setStage({ kind: "pick" })}
              className="mt-2 text-sm font-medium text-emerald-700 hover:underline"
            >
              Ganti foto
            </button>
          </div>
        </div>
      </Card>
      <ExpenseForm
        key={formKey}
        initial={draftToInput(stage.draft)}
        warnings={stage.draft.warnings}
      />
    </div>
  );
}