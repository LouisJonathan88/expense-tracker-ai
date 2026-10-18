"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/expenses", label: "Transaksi" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-5xl gap-4 px-4 sm:px-6" aria-label="Navigasi utama">
      {links.map(({ href, label }) => {
        const active =
          href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`border-b-2 px-1 pb-2 text-sm font-medium ${
              active
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}