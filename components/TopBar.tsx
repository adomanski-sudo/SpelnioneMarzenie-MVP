// src/components/TopBar.tsx
import Link from "next/link";
import { Bell, UserCircle } from "lucide-react";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm">
      {/* 1. Powiadomienia (Lewa) */}
      <Link href="/notifications" className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
        <Bell size={24} />
        {/* Czerwona kropka z cyfrą */}
        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          3
        </span>
      </Link>

      {/* 2. Logo (Środek) */}
      <Link href="/" className="text-xl font-bold">
        <span className="text-blue-600">Spełnione</span>
        <span className="text-gray-800">Marzenie</span>
        <span className="text-blue-600">.pl</span>
      </Link>

      {/* 3. Profil / Awatar (Prawa) */}
      {/* Docelowo tutaj podepniemy sesję i sprawdzimy czy jest zdjęcie z Google */}
      <Link href="/profile" className="p-1 text-gray-600 hover:text-blue-600 transition-colors">
        <UserCircle size={28} strokeWidth={1.5} />
      </Link>
    </header>
  );
}