"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Users, Plus } from "lucide-react";

export default function BottomBar() {
  const pathname = usePathname();

  // Sprawdzamy, która zakładka jest aktualnie otwarta
  const isSearchActive = pathname.startsWith("/search");
  const isFriendsActive = pathname.startsWith("/friends");

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 pointer-events-none">
      <div className="relative h-20 w-full flex items-end">
        
        {/* 1. WEKTOROWE TŁO PASKA Z ZAOKRĄGLENIAMI I WCIĘCIEM NA ŚRODKU */}
        <svg
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full text-white drop-shadow-[0_-6px_16px_rgba(15,23,42,0.08)] pointer-events-auto"
        >
          <path
            d="M 0,80 L 0,30 Q 0,0 32,0 L 135,0 C 162,0 168,42 200,42 C 232,42 238,0 265,0 L 368,0 Q 400,0 400,30 L 400,80 Z"
            fill="currentColor"
          />
        </svg>

        {/* 2. CENTRALNY PRZYCISK "+" (Wystający ponad wcięcie) */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-5 z-20 pointer-events-auto">
          <Link
            href="/add"
            aria-label="Dodaj marzenie"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1967d2] hover:bg-blue-700 text-white shadow-[0_8px_20px_rgba(25,103,210,0.4)] transition-transform active:scale-95"
          >
            <Plus size={36} strokeWidth={2} />
          </Link>
        </div>

        {/* 3. PRZYCISKI BOCZNE: SZUKAJ (Lewa) i ZNAJOMI (Prawa) */}
        <div className="relative z-10 w-full flex justify-between items-center px-12 pb-3 pt-4 pointer-events-auto">
          
          {/* Lewa strona: Szukaj */}
          <Link
            href="/search"
            className={`flex flex-col items-center gap-1 transition-colors ${
              isSearchActive
                ? "text-[#1967d2]"
                : "text-gray-700 hover:text-[#1967d2]"
            }`}
          >
            <Search size={26} strokeWidth={2.2} />
            <span className="text-xs font-semibold tracking-tight">Szukaj</span>
          </Link>

          {/* Puste miejsce pod środkowym wcięciem */}
          <div className="w-20" />

          {/* Prawa strona: Znajomi */}
          <Link
            href="/friends"
            className={`flex flex-col items-center gap-1 transition-colors ${
              isFriendsActive
                ? "text-[#1967d2]"
                : "text-gray-700 hover:text-[#1967d2]"
            }`}
          >
            <Users size={26} strokeWidth={2} />
            <span className="text-xs font-semibold tracking-tight">Znajomi</span>
          </Link>

        </div>
      </div>
    </nav>
  );
}