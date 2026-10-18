// import type { Metadata } from "next";
// import Link from "next/link";
// import { redirect } from "next/navigation";
// import { AppShell } from "@/components/AppShell";
// import { ExpenseListItem } from "@/components/ExpenseListItem";
// import { Button, buttonClass } from "@/components/ui/Button";
// import { Input } from "@/components/ui/Input";
// import { backendFetch } from "@/lib/backend";
// import type { ExpensePage } from "@/types/expense";

// export const metadata: Metadata = { title: "Semua transaksi" };

// const PAGE_SIZE = 20;

// interface Filters {
//   q: string;
//   start: string;
//   end: string;
// }

// const isIsoDate = (v?: string): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

// function buildHref({ q, start, end }: Filters, page: number): string {
//   const params = new URLSearchParams();
//   if (q) params.set("q", q);
//   if (start) params.set("start", start);
//   if (end) params.set("end", end);
//   if (page > 1) params.set("page", String(page));
//   const qs = params.toString();
//   return qs ? `/expenses?${qs}` : "/expenses";
// }

// export default async function ExpensesPage({
//   searchParams,
// }: {
//   searchParams: Promise<{ q?: string; start?: string; end?: string; page?: string }>;
// }) {
//   const sp = await searchParams;
//   const filters: Filters = {
//     q: (sp.q ?? "").trim().slice(0, 100),
//     start: isIsoDate(sp.start) ? sp.start : "",
//     end: isIsoDate(sp.end) ? sp.end : "",
//   };
//   const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

//   const query = new URLSearchParams({
//     limit: String(PAGE_SIZE),
//     offset: String((page - 1) * PAGE_SIZE),
//   });
//   if (filters.q) query.set("q", filters.q);
//   if (filters.start) query.set("start", filters.start);
//   if (filters.end) query.set("end", filters.end);

//   const res = await backendFetch(`/expenses?${query}`);
//   if (res.status === 422) redirect("/expenses"); // filter tidak valid (mis. tanggal fiktif)
//   if (!res.ok) throw new Error("Gagal memuat transaksi.");
//   const data: ExpensePage = await res.json();

//   const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
//   if (page > totalPages) redirect(buildHref(filters, totalPages));

//   const hasFilter = Boolean(filters.q || filters.start || filters.end);

//   return (
//     <AppShell>
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-2xl font-semibold">Semua transaksi</h1>
//           <p className="mt-1 text-sm text-slate-500">
//             {data.total} transaksi{hasFilter ? " ditemukan" : ""}
//           </p>
//         </div>
//         <Link href="/expenses/new" className={buttonClass("primary")}>
//           + Tambah
//         </Link>
//       </div>

//       <form
//         method="get"
//         action="/expenses"
//         className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end"
//       >
//         <Input
//           id="q"
//           name="q"
//           label="Cari barang"
//           placeholder="mis. susu"
//           maxLength={100}
//           defaultValue={filters.q}
//         />
//         <Input id="start" name="start" label="Dari tanggal" type="date" defaultValue={filters.start} />
//         <Input id="end" name="end" label="Sampai tanggal" type="date" defaultValue={filters.end} />
//         <div className="flex gap-2">
//           <Button type="submit">Terapkan</Button>
//           {hasFilter && (
//             <Link href="/expenses" className={buttonClass("secondary")}>
//               Reset
//             </Link>
//           )}
//         </div>
//       </form>

//       {data.results.length === 0 ? (
//         <p className="mt-8 text-sm text-slate-500">
//           {hasFilter ? "Tidak ada transaksi yang cocok." : "Belum ada pengeluaran."}
//         </p>
//       ) : (
//         <ul className="mt-6 space-y-2">
//           {data.results.map((e) => (
//             <ExpenseListItem key={e.id} expense={e} />
//           ))}
//         </ul>
//       )}

//       {totalPages > 1 && (
//         <nav className="mt-6 flex items-center justify-between" aria-label="Halaman">
//           {page > 1 ? (
//             <Link href={buildHref(filters, page - 1)} className={buttonClass("secondary")}>
//               ‹ Sebelumnya
//             </Link>
//           ) : (
//             <span />
//           )}
//           <span className="text-sm text-slate-500">
//             Halaman {page} dari {totalPages}
//           </span>
//           {page < totalPages ? (
//             <Link href={buildHref(filters, page + 1)} className={buttonClass("secondary")}>
//               Berikutnya ›
//             </Link>
//           ) : (
//             <span />
//           )}
//         </nav>
//       )}
//     </AppShell>
//   );
// }

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ExpenseListItem } from "@/components/ExpenseListItem";
import { Button, buttonClass } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { backendFetch } from "@/lib/backend";
import type { ExpensePage } from "@/types/expense";

export const metadata: Metadata = { title: "Semua transaksi" };

const PAGE_SIZE = 20;

interface Filters {
  start: string;
  end: string;
}

const isIsoDate = (v?: string): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

function toQuery({ start, end }: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  return params;
}

function pageHref(filters: Filters, page: number): string {
  const params = toQuery(filters);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/expenses?${qs}` : "/expenses";
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const filters: Filters = {
    start: isIsoDate(sp.start) ? sp.start : "",
    end: isIsoDate(sp.end) ? sp.end : "",
  };
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const query = toQuery(filters);
  query.set("limit", String(PAGE_SIZE));
  query.set("offset", String((page - 1) * PAGE_SIZE));

  const res = await backendFetch(`/expenses?${query}`);
  if (res.status === 422) redirect("/expenses"); // filter tidak valid (mis. tanggal fiktif)
  if (!res.ok) throw new Error("Gagal memuat transaksi.");
  const data: ExpensePage = await res.json();

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  if (page > totalPages) redirect(pageHref(filters, totalPages));

  const hasFilter = Boolean(filters.start || filters.end);
  const exportQs = toQuery(filters).toString();
  const exportHref = exportQs ? `/api/expenses/export?${exportQs}` : "/api/expenses/export";

  return (
    <AppShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Semua transaksi</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data.total} transaksi{hasFilter ? " ditemukan" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.total > 0 && (
            // Tautan biasa (bukan <Link>) agar tidak di-prefetch dan memicu pembuatan file
            <a href={exportHref} className={buttonClass("secondary")}>
              Ekspor Excel
            </a>
          )}
          <Link href="/expenses/new" className={buttonClass("primary")}>
            + Tambah
          </Link>
        </div>
      </div>

      <form
        method="get"
        action="/expenses"
        className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <Input id="start" name="start" label="Dari tanggal" type="date" defaultValue={filters.start} />
        <Input id="end" name="end" label="Sampai tanggal" type="date" defaultValue={filters.end} />
        <div className="flex gap-2">
          <Button type="submit">Terapkan</Button>
          {hasFilter && (
            <Link href="/expenses" className={buttonClass("secondary")}>
              Reset
            </Link>
          )}
        </div>
      </form>
      {data.total > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          Ekspor mencakup semua transaksi sesuai filter, bukan hanya halaman ini.
        </p>
      )}

      {data.results.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          {hasFilter ? "Tidak ada transaksi pada rentang tanggal ini." : "Belum ada pengeluaran."}
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {data.results.map((e) => (
            <ExpenseListItem key={e.id} expense={e} />
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-between" aria-label="Halaman">
          {page > 1 ? (
            <Link href={pageHref(filters, page - 1)} className={buttonClass("secondary")}>
              ‹ Sebelumnya
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-slate-500">
            Halaman {page} dari {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(filters, page + 1)} className={buttonClass("secondary")}>
              Berikutnya ›
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </AppShell>
  );
}