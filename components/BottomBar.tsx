// src/components/BottomBar.tsx
import Link from "next/link";
import { Search, Users, Plus } from "lucide-react";

export default function BottomBar() {
  return (
    <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 px-6 py-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-between items-center relative">
        
        {/* 1. Szukaj (Lewa) */}
        <Link href="/search" className="flex flex-col items-center p-2 text-gray-500 hover:text-blue-600 transition-colors">
          <Search size={24} />
          <span className="text-[10px] font-medium mt-1">Szukaj</span>
        </Link>

        {/* 2. Centralny, wystający przycisk "+" (Dodaj marzenie) */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
          <Link 
            href="/add" 
            className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-transform active:scale-95"
          >
            <Plus size={32} strokeWidth={2.5} />
          </Link>
        </div>

        {/* 3. Znajomi (Prawa) */}
        <Link href="/friends" className="flex flex-col items-center p-2 text-gray-500 hover:text-blue-600 transition-colors">
          <Users size={24} />
          <span className="text-[10px] font-medium mt-1">Znajomi</span>
        </Link>

      </div>
    </nav>
  );
}