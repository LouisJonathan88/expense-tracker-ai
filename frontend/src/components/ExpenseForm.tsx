"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createExpense, updateExpense } from "@/lib/client-api";
import { todayLocal } from "@/lib/dates";
import { formatRupiah } from "@/lib/format";
import type { ExpenseInput } from "@/types/expense";

interface FormItem {
  key: number;
  item_name: string;
  quantity: string;
  price: string;
}

interface ExpenseFormProps {
  initial?: ExpenseInput;
  warnings?: string[];
  expenseId?: number;
}

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40";

const digitsOnly = (value: string) => value.replace(/\D/g, "");

function buildInitialItems(initial?: ExpenseInput): FormItem[] {
  if (initial && initial.items.length > 0) {
    return initial.items.map((i, index) => ({
      key: index,
      item_name: i.item_name,
      quantity: String(i.quantity),
      price: String(i.price),
    }));
  }
  return [{ key: 0, item_name: "", quantity: "1", price: "" }];
}

export function ExpenseForm({
  initial,
  warnings = [],
  expenseId,
}: ExpenseFormProps) {
  const router = useRouter();

  const [date, setDate] = useState(() => initial?.expense_date ?? todayLocal());
  const [items, setItems] = useState<FormItem[]>(() =>
    buildInitialItems(initial),
  );
  const [adjSign, setAdjSign] = useState<"plus" | "minus">(
    (initial?.adjustment ?? 0) < 0 ? "minus" : "plus",
  );
  const [adjAmount, setAdjAmount] = useState(() =>
    initial && initial.adjustment !== 0
      ? String(Math.abs(initial.adjustment))
      : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const itemsTotal = items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.price) || 0),
    0,
  );
  const adjustment = (adjSign === "minus" ? -1 : 1) * (Number(adjAmount) || 0);
  const total = itemsTotal + adjustment;

  function updateItem(key: number, patch: Partial<Omit<FormItem, "key">>) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, ...patch } : i)),
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        key: Math.max(-1, ...prev.map((i) => i.key)) + 1,
        item_name: "",
        quantity: "1",
        price: "",
      },
    ]);
  }

  function removeItem(key: number) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function validate(): string | null {
    if (!date) return "Tanggal wajib diisi.";
    for (const [index, item] of items.entries()) {
      const n = index + 1;
      if (!item.item_name.trim()) return `Nama barang ke-${n} belum diisi.`;
      if (!(Number(item.quantity) >= 1))
        return `Jumlah barang ke-${n} minimal 1.`;
      if (item.price === "") return `Harga barang ke-${n} belum diisi.`;
    }
    if (total < 0) return "Total tidak boleh negatif. Periksa penyesuaian.";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    const payload: ExpenseInput = {
      expense_date: date,
      items: items.map((i) => ({
        item_name: i.item_name.trim(),
        price: Number(i.price),
        quantity: Number(i.quantity),
      })),
      adjustment,
    };

    setError(null);
    setSubmitting(true);
    try {
      if (expenseId) {
        await updateExpense(expenseId, payload);
        router.push(`/expenses/${expenseId}`);
      } else {
        await createExpense(payload);
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="space-y-6">
        {warnings.length > 0 && (
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-medium">Periksa kembali hasil scan:</p>
            <ul className="mt-1 list-disc pl-5">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <Input
          id="expense-date"
          label="Tanggal"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div>
          <p className="text-sm font-medium text-slate-700">Barang</p>
          <div className="mt-2 space-y-3">
            {items.map((item, index) => (
              <div
                key={item.key}
                className="rounded-lg border border-slate-200 p-3"
              >
                <input
                  aria-label={`Nama barang ${index + 1}`}
                  placeholder="Nama barang"
                  maxLength={255}
                  value={item.item_name}
                  onChange={(e) =>
                    updateItem(item.key, { item_name: e.target.value })
                  }
                  className={fieldClass.replace("mt-1 ", "")}
                />
                <div className="mt-2 flex gap-2">
                  <label className="block w-24">
                    <span className="text-xs text-slate-500">Jumlah</span>
                    <input
                      inputMode="numeric"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.key, {
                          quantity: digitsOnly(e.target.value),
                        })
                      }
                      className={fieldClass}
                    />
                  </label>
                  <label className="block flex-1">
                    <span className="text-xs text-slate-500">
                      Harga satuan (Rp)
                    </span>
                    <input
                      inputMode="numeric"
                      placeholder="0"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(item.key, {
                          price: digitsOnly(e.target.value),
                        })
                      }
                      className={fieldClass}
                    />
                  </label>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  {items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Hapus barang
                    </button>
                  ) : (
                    <span />
                  )}
                  <p className="text-sm font-medium tabular-nums">
                    {formatRupiah(
                      (Number(item.quantity) || 0) * (Number(item.price) || 0),
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={addItem}
            className="mt-3"
          >
            + Tambah barang
          </Button>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">
            Penyesuaian (opsional)
          </p>
          <p className="text-xs text-slate-500">
            Pajak, service, atau diskon total sesuai struk.
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <div className="inline-flex self-start rounded-lg bg-slate-100 p-1 text-sm">
              {(["minus", "plus"] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setAdjSign(s)}
                  className={`rounded-md px-3 py-1.5 ${
                    adjSign === s
                      ? "bg-white font-medium shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  {s === "minus" ? "Diskon (−)" : "Tambahan (+)"}
                </button>
              ))}
            </div>
            <input
              inputMode="numeric"
              placeholder="0"
              aria-label="Nominal penyesuaian"
              value={adjAmount}
              onChange={(e) => setAdjAmount(digitsOnly(e.target.value))}
              className={`${fieldClass.replace("mt-1 ", "")} sm:flex-1`}
            />
          </div>
        </div>

        <div className="space-y-1 rounded-lg bg-slate-50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Jumlah barang</span>
            <span className="tabular-nums">{formatRupiah(itemsTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Penyesuaian</span>
            <span className="tabular-nums">{formatRupiah(adjustment)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
            <span>Total dibayar</span>
            <span className={`tabular-nums ${total < 0 ? "text-red-600" : ""}`}>
              {formatRupiah(total)}
            </span>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting
              ? "Menyimpan..."
              : expenseId
                ? "Simpan perubahan"
                : "Simpan"}
          </Button>
          <Link
            href={expenseId ? `/expenses/${expenseId}` : "/dashboard"}
            className={buttonClass("secondary")}
          >
            Batal
          </Link>
        </div>
      </Card>
    </form>
  );
}
