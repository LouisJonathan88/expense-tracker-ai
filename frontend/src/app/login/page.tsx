import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;
  const session = await auth();

  if (session?.accessToken && !expired) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Expense Tracker AI</h1>
        <p className="mt-2 text-sm text-slate-500">
          Catat pengeluaran dari foto struk, atau isi manual.
        </p>

        {expired && (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Sesi berakhir, silakan masuk lagi.
          </p>
        )}

        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Masuk dengan Google
          </button>
        </form>
      </div>
    </main>
  );
}