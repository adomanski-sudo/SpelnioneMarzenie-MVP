import Link from "next/link";
import { Bell, UserCircle, LogIn } from "lucide-react";
import { auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function TopBar() {
  const session = await auth();

  // Obliczamy liczbę nieprzeczytanych powiadomień i zaproszeń
  let unreadCount = 0;

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
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
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm">
      {/* 1. Powiadomienia (Lewa) */}
      <Link href="/notifications" className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </Link>

      {/* 2. Logo (Środek) */}
      <Link href="/" className="text-xl font-bold tracking-tight">
        <span className="text-blue-600">Spełnione</span>
        <span className="text-gray-800">Marzenie</span>
        <span className="text-blue-600">.pl</span>
      </Link>

      {/* 3. Profil lub Logowanie (Prawa) */}
      {session?.user ? (
        <Link href="/profile" className="p-1 text-gray-600 hover:text-blue-600 transition-colors flex items-center">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "Profil"}
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
    </header>
  );
}