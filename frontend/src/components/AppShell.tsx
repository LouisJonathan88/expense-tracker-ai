import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { buttonClass } from "@/components/ui/Button";
import { UserMenu } from "./UserMenu";
import { NavLinks } from "@/components/NavLinks";

export async function AppShell({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.accessToken) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/dashboard"
            className="text-lg font-semibold text-emerald-600"
          >
            Expense Tracker AI
          </Link>

          <div className="flex items-center gap-3">
            <UserMenu name={session.user?.name} />

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button type="submit" className={buttonClass("secondary")}>
                Keluar
              </button>
            </form>
          </div>
        </div>
         <NavLinks />
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
