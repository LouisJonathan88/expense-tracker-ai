"use client";

import { useState } from "react";
import type { Bar } from "@/lib/dates";
import { formatRupiah } from "@/lib/format";

export function SummaryBars({ bars }: { bars: Bar[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...bars.map((b) => b.value), 0);
  const showEvery = bars.length > 12 ? 5 : 1;
  const selected = active !== null ? bars[active] : null;

  return (
    <div>
      <p className="mb-3 min-h-5 text-sm text-slate-600" aria-live="polite">
        {selected ? (
          <>
            <span className="font-medium">{selected.title}</span>:{" "}
            <span className="tabular-nums">{formatRupiah(selected.value)}</span>
          </>
        ) : (
          "Ketuk atau klik batang untuk melihat nominal."
        )}
      </p>

      {/* Per hari = 31 batang: di layar sempit bisa digeser agar tiap batang cukup lebar untuk disentuh */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: bars.length > 12 ? bars.length * 14 : undefined }}>
          <div className="flex h-40 items-end gap-1">
            {bars.map((b, i) => (
              <button
                key={b.title}
                type="button"
                onClick={() => setActive(active === i ? null : i)}
                aria-label={`${b.title}: ${formatRupiah(b.value)}`}
                aria-pressed={active === i}
                className="group flex h-full flex-1 flex-col justify-end focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <span
                  className={`block w-full rounded-t ${
                    active === i
                      ? "bg-emerald-700"
                      : "bg-emerald-500 group-hover:bg-emerald-600"
                  }`}
                  style={{
                    height: max > 0 ? `${(b.value / max) * 100}%` : "0%",
                    minHeight: b.value > 0 ? 2 : 0,
                  }}
                />
              </button>
            ))}
          </div>
          <div className="mt-1 flex gap-1" aria-hidden="true">
            {bars.map((b, i) => (
              <span
                key={b.title}
                className="flex-1 text-center text-[11px] text-slate-500"
              >
                {i % showEvery === 0 ? b.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}