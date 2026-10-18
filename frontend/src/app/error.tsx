"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonClass } from "@/components/ui/Button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold">Terjadi kesalahan</h1>
        <p className="mt-2 text-sm text-slate-500">
          Data tidak bisa dimuat. Pastikan server berjalan, lalu coba lagi.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>Coba lagi</Button>
          <Link href="/dashboard" className={buttonClass("secondary")}>
            Ke dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}