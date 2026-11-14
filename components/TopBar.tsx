// components/TopBar.tsx
import Link from "next/link";
import { Bell, UserCircle, LogIn, Search, Users, Plus } from "lucide-react";
import { auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function TopBar() {
  const session = await auth();
let unreadCount = 0;
  let userAvatar: string | null = session?.user?.image || null;

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        image: true, // Pobieramy aktualny awatar z bazy MySQL
        _count: {
          select: {
            receivedRequests: { where: { status: "PENDING" } },
            notifications: { where: { isRead: false } },
          },
        },
      },
    });

    if (user) {
      unreadCount = user._count.receivedRequests + user._count.notifications;
      userAvatar = user.image || session.user.image || null;
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="w-full md:max-w-5xl md:mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* 1. Lewa strona: Dzwoneczek (na telefonie) + Logo (na komputerze obok dzwoneczka) */}
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Logo widoczne po lewej stronie tylko na komputerze */}
          <Link href="/" className="hidden md:block text-xl font-bold tracking-tight">
            <span className="text-blue-600">Spełnione</span>
            <span className="text-gray-800">Marzenie</span>
            <span className="text-blue-600">.pl</span>
          </Link>
        </div>

        {/* 2. Środek na telefonie: Logo (ukryte na komputerze, bo tam jest po lewej) */}
        <Link href="/" className="md:hidden text-xl font-bold tracking-tight">
          <span className="text-blue-600">Spełnione</span>
          <span className="text-gray-800">Marzenie</span>
          <span className="text-blue-600">.pl</span>
        </Link>

        {/* 2b. Środek na komputerze: Nawigacja przeniesiona z dolnego paska */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/search" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">
            <Search size={18} />
            <span>Szukaj</span>
          </Link>
          <Link href="/friends" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">
            <Users size={18} />
            <span>Znajomi</span>
          </Link>
          <Link
            href="/add"
            className="flex items-center gap-1.5 bg-[#1967d2] hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl shadow-sm transition-colors"
          >
            <Plus size={18} />
            <span>Dodaj marzenie</span>
          </Link>
        </nav>

        {/* 3. Prawa strona: Profil lub Logowanie */}
          {session?.user ? (
        <Link href="/profile" className="p-1 text-gray-600 hover:text-blue-600 transition-colors flex items-center">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={session.user.name || "Profil"}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full border border-gray-200 object-cover"
            />
          ) : (
            <UserCircle size={28} strokeWidth={1.5} />
          )}
        </Link>
      ) : (
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-full transition-colors shadow-sm cursor-pointer"
            >
              <LogIn size={14} />
              <span>Zaloguj</span>
            </button>
          </form>
        )}

      </div>
    </header>
  );
}