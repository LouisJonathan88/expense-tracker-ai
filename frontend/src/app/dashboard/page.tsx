// import Link from "next/link";
// import { AppShell } from "@/components/AppShell";
// import { SummaryBars } from "@/components/SummaryBars";
// import { Badge } from "@/components/ui/Badge";
// import { buttonClass } from "@/components/ui/Button";
// import { Card } from "@/components/ui/Card";
// import { backendFetch } from "@/lib/backend";
// import {
//   buildDayBars,
//   buildMonthBars,
//   currentMonth,
//   monthRange,
//   parseMonth,
//   shiftMonth,
// } from "@/lib/dates";
// import { formatBulan, formatRupiah, formatTanggal } from "@/lib/format";
// import type { Expense, SummaryRow } from "@/types/expense";
// import type { Metadata } from "next";

// export const metadata: Metadata = {
//   title: "Dashboard",
// };

// export default async function DashboardPage({
//   searchParams,
// }: {
//   searchParams: Promise<{ month?: string; group?: string }>;
// }) {
//   const params = await searchParams;
//   const month = parseMonth(params.month);
//   const group = params.group === "month" ? "month" : "day";
//   const { start, end } = monthRange(month);
//   const summaryStart =
//     group === "month" ? `${shiftMonth(month, -11)}-01` : start;

//   const [listRes, summaryRes] = await Promise.all([
//     backendFetch(`/expenses?start=${start}&end=${end}`),
//     backendFetch(
//       `/expenses/summary?group_by=${group}&start=${summaryStart}&end=${end}`,
//     ),
//   ]);

//   const expenses: Expense[] = listRes.ok ? await listRes.json() : [];
//   const summary: SummaryRow[] = summaryRes.ok ? await summaryRes.json() : [];

//   const total = expenses.reduce((sum, e) => sum + Number(e.total), 0);
//   const bars =
//     group === "month"
//       ? buildMonthBars(month, summary)
//       : buildDayBars(month, summary);

//   const prevMonth = shiftMonth(month, -1);
//   const nextMonth = shiftMonth(month, 1);
//   const canGoNext = month < currentMonth();

//   return (
//     <AppShell>
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//         <h1 className="text-2xl font-semibold">Dashboard</h1>
//         <div className="flex gap-2">
//           <Link
//             href="/expenses/new?mode=scan"
//             className={buttonClass("primary", "flex-1 sm:flex-none")}
//           >
//             Scan struk
//           </Link>
//           <Link
//             href="/expenses/new"
//             className={buttonClass("secondary", "flex-1 sm:flex-none")}
//           >
//             Tambah manual
//           </Link>
//         </div>
//       </div>

//       <div className="mt-6 flex items-center justify-between">
//         <Link
//           href={`/dashboard?month=${prevMonth}&group=${group}`}
//           className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
//           aria-label="Bulan sebelumnya"
//         >
//           ‹
//         </Link>
//         <span className="font-medium">{formatBulan(`${month}-01`)}</span>
//         {canGoNext ? (
//           <Link
//             href={`/dashboard?month=${nextMonth}&group=${group}`}
//             className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
//             aria-label="Bulan berikutnya"
//           >
//             ›
//           </Link>
//         ) : (
//           <span className="px-3 py-2 text-slate-300">›</span>
//         )}
//       </div>

//       <div className="mt-4 grid grid-cols-2 gap-3">
//         <Card>
//           <p className="text-sm text-slate-500">Total pengeluaran</p>
//           <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
//             {formatRupiah(total)}
//           </p>
//         </Card>
//         <Card>
//           <p className="text-sm text-slate-500">Jumlah transaksi</p>
//           <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
//             {expenses.length}
//           </p>
//         </Card>
//       </div>

//       <Card className="mt-4">
//         <div className="mb-4 flex items-center justify-between">
//           <p className="text-sm text-slate-500">
//             {group === "day" ? "Per hari" : "12 bulan terakhir"}
//           </p>
//           <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm">
//             {(["day", "month"] as const).map((g) => (
//               <Link
//                 key={g}
//                 href={`/dashboard?month=${month}&group=${g}`}
//                 className={`rounded-md px-3 py-1.5 ${
//                   group === g
//                     ? "bg-white font-medium shadow-sm"
//                     : "text-slate-600"
//                 }`}
//               >
//                 {g === "day" ? "Per hari" : "Per bulan"}
//               </Link>
//             ))}
//           </div>
//         </div>
//         <SummaryBars key={`${month}-${group}`} bars={bars} />
//       </Card>

//       <h2 className="mt-8 text-lg font-semibold">Transaksi</h2>
//       {expenses.length === 0 ? (
//         <p className="mt-3 text-sm text-slate-500">
//           Belum ada pengeluaran di bulan ini.
//         </p>
//       ) : (
//         <ul className="mt-3 space-y-2">
//           {expenses.map((e) => {
//             const adjustment = Number(e.adjustment);
//             return (
//               <li key={e.id}>
//                 <Link
//                   href={`/expenses/${e.id}`}
//                   className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-emerald-300"
//                 >
//                   <div className="min-w-0">
//                     <p className="text-sm font-medium">
//                       {formatTanggal(e.expense_date)}
//                     </p>
//                     <p className="truncate text-sm text-slate-500">
//                       {e.items.map((i) => i.item_name).join(", ")}
//                     </p>
//                   </div>
//                   <div className="shrink-0 text-right">
//                     <p className="font-medium tabular-nums">
//                       {formatRupiah(e.total)}
//                     </p>
//                     {adjustment !== 0 && (
//                       <Badge tone={adjustment < 0 ? "success" : "neutral"}>
//                         {adjustment > 0 ? "+" : ""}
//                         {formatRupiah(adjustment)}
//                       </Badge>
//                     )}
//                   </div>
//                 </Link>
//               </li>
//             );
//           })}
//         </ul>
//       )}
//     </AppShell>
//   );
// }


import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ExpenseListItem } from "@/components/ExpenseListItem";
import { SummaryBars } from "@/components/SummaryBars";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { backendFetch } from "@/lib/backend";
import {
  buildDayBars,
  buildMonthBars,
  currentMonth,
  monthRange,
  parseMonth,
  shiftMonth,
} from "@/lib/dates";
import { formatBulan, formatRupiah } from "@/lib/format";
import type { ExpensePage, SummaryRow } from "@/types/expense";

export const metadata: Metadata = { title: "Dashboard" };

const RECENT_LIMIT = 10;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; group?: string }>;
}) {
  const params = await searchParams;
  const month = parseMonth(params.month);
  const group = params.group === "month" ? "month" : "day";
  const { start, end } = monthRange(month);
  const summaryStart = group === "month" ? `${shiftMonth(month, -11)}-01` : start;

  const [listRes, summaryRes, monthRes] = await Promise.all([
    backendFetch(`/expenses?start=${start}&end=${end}&limit=${RECENT_LIMIT}`),
    backendFetch(`/expenses/summary?group_by=${group}&start=${summaryStart}&end=${end}`),
    backendFetch(`/expenses/summary?group_by=month&start=${start}&end=${end}`),
  ]);

  const recent: ExpensePage = listRes.ok
    ? await listRes.json()
    : { results: [], total: 0, limit: RECENT_LIMIT, offset: 0 };
  const summary: SummaryRow[] = summaryRes.ok ? await summaryRes.json() : [];
  const monthRows: SummaryRow[] = monthRes.ok ? await monthRes.json() : [];

  const total = Number(monthRows[0]?.total ?? 0);
  const bars =
    group === "month" ? buildMonthBars(month, summary) : buildDayBars(month, summary);

  const prevMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);
  const canGoNext = month < currentMonth();

  return (
    <AppShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          <Link
            href="/expenses/new?mode=scan"
            className={buttonClass("primary", "flex-1 sm:flex-none")}
          >
            Scan struk
          </Link>
          <Link href="/expenses/new" className={buttonClass("secondary", "flex-1 sm:flex-none")}>
            Tambah manual
          </Link>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Link
          href={`/dashboard?month=${prevMonth}&group=${group}`}
          className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
          aria-label="Bulan sebelumnya"
        >
          ‹
        </Link>
        <span className="font-medium">{formatBulan(`${month}-01`)}</span>
        {canGoNext ? (
          <Link
            href={`/dashboard?month=${nextMonth}&group=${group}`}
            className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
            aria-label="Bulan berikutnya"
          >
            ›
          </Link>
        ) : (
          <span className="px-3 py-2 text-slate-300">›</span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card>
          <p className="text-sm text-slate-500">Total pengeluaran</p>
          <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
            {formatRupiah(total)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Jumlah transaksi</p>
          <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
            {recent.total}
          </p>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {group === "day" ? "Per hari" : "12 bulan terakhir"}
          </p>
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm">
            {(["day", "month"] as const).map((g) => (
              <Link
                key={g}
                href={`/dashboard?month=${month}&group=${g}`}
                className={`rounded-md px-3 py-1.5 ${
                  group === g ? "bg-white font-medium shadow-sm" : "text-slate-600"
                }`}
              >
                {g === "day" ? "Per hari" : "Per bulan"}
              </Link>
            ))}
          </div>
        </div>
        <SummaryBars key={`${month}-${group}`} bars={bars} />
      </Card>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Transaksi terbaru</h2>
        {recent.total > RECENT_LIMIT && (
          <Link
            href={`/expenses?start=${start}&end=${end}`}
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            Lihat semua ({recent.total})
          </Link>
        )}
      </div>
      {recent.results.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Belum ada pengeluaran di bulan ini.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {recent.results.map((e) => (
            <ExpenseListItem key={e.id} expense={e} />
          ))}
        </ul>
      )}
    </AppShell>
  );
}