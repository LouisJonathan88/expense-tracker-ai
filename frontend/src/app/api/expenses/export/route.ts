import { backendProxy, relay } from "@/lib/backend";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Hanya tanggal berformat valid yang diteruskan ke backend
  const params = new URLSearchParams();
  for (const key of ["start", "end"]) {
    const value = searchParams.get(key);
    if (value && ISO_DATE.test(value)) params.set(key, value);
  }

  const res = await backendProxy(`/expenses/export?${params}`);
  if (!res.ok) return relay(res);

  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition":
        res.headers.get("Content-Disposition") ?? 'attachment; filename="pengeluaran.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}