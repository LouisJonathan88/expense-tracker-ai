"use client";

import { useEffect, useRef, useState } from "react";
import { UserRound } from "lucide-react";

interface UserMenuProps {
  name?: string | null;
}

export function UserMenu({ name }: UserMenuProps) {
  const [showUserName, setShowUserName] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowUserName(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Desktop: nama pengguna */}
      <span className="hidden text-sm text-slate-500 sm:inline">
        {name}
      </span>

      {/* Mobile: icon person */}
      <button
        type="button"
        onClick={() => setShowUserName((prev) => !prev)}
        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 sm:hidden"
        aria-label="Tampilkan nama pengguna"
        aria-expanded={showUserName}
        title="Profil pengguna"
      >
        <UserRound size={20} />
      </button>

      {/* Nama pengguna */}
      {showUserName && (
        <div className="absolute right-0 top-full z-50 mt-2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-md sm:hidden">
          {name || "Pengguna"}
        </div>
      )}
    </div>
  );
}