import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-slate-500">
          Alamat yang kamu buka tidak ada, atau transaksinya sudah dihapus.
        </p>
        <Link href="/dashboard" className={buttonClass("primary", "mt-6")}>
          Ke dashboard
        </Link>
      </div>
    </main>
  );
}