import type { SummaryRow } from "@/types/expense";
import { formatBulan, formatTanggal } from "@/lib/format";

export interface Bar {
  label: string;
  title: string;
  value: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function parseMonth(value: string | undefined): string {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : currentMonth();
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate(); // hari ke-0 bulan berikutnya = hari terakhir bulan ini
  return { start: `${month}-01`, end: `${month}-${pad(lastDay)}` };
}

function shortMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "short" });
}

// Satu batang per hari dalam bulan itu
export function buildDayBars(month: string, rows: SummaryRow[]): Bar[] {
  const totals = new Map(rows.map((r) => [r.period, Number(r.total)]));
  const lastDay = Number(monthRange(month).end.slice(8));
  return Array.from({ length: lastDay }, (_, i) => {
    const iso = `${month}-${pad(i + 1)}`;
    return {
      label: String(i + 1),
      title: formatTanggal(iso),
      value: totals.get(iso) ?? 0,
    };
  });
}

// 12 bulan terakhir sampai bulan yang dipilih
export function buildMonthBars(month: string, rows: SummaryRow[]): Bar[] {
  const totals = new Map(rows.map((r) => [r.period.slice(0, 7), Number(r.total)]));
  return Array.from({ length: 12 }, (_, i) => {
    const m = shiftMonth(month, i - 11);
    return {
      label: shortMonthLabel(m),
      title: formatBulan(`${m}-01`),
      value: totals.get(m) ?? 0,
    };
  });
}

export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}