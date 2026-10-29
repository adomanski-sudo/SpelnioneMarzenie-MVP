import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { acceptFriendRequest, rejectFriendRequest } from "@/actions/friendActions";
import { markNotificationsAsReadAction } from "@/actions/dreamActions";
import Link from "next/link";
import { Bell, UserPlus, Gift, CheckCheck, ArrowRight } from "lucide-react";

// export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <div className="p-6 text-center space-y-3 mt-8">
        <Bell size={36} className="mx-auto text-gray-300" />
        <h1 className="text-lg font-bold text-gray-800">Powiadomienia</h1>
        <p className="text-gray-500 text-sm">
          Zaloguj się, aby zobaczyć zaproszenia do znajomych i alerty o prezentach.
        </p>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      receivedRequests: {
        where: { status: "PENDING" },
        include: { sender: true },
        orderBy: { createdAt: "desc" },
      },
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!user) return <div className="p-4 text-center">Nie znaleziono użytkownika.</div>;

  const hasUnreadNotifications = user.notifications.some((n) => !n.isRead);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          Powiadomienia
        </h1>

        {hasUnreadNotifications && (
          <form action={markNotificationsAsReadAction}>
            <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer">
              <CheckCheck size={14} /> Oznacz jako przeczytane
            </button>
          </form>
        )}
      </div>

      {/* 1. SEKCJA: ZAPROSZENIA DO ZNAJOMYCH */}
      {user.receivedRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <UserPlus size={14} /> Zaproszenia do znajomych ({user.receivedRequests.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {user.receivedRequests.map((req : any) => (
              <div
                key={req.id}
                className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                    {req.sender.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-gray-900 truncate">{req.sender.name}</p>
                    <p className="text-xs text-gray-500 truncate">chce dodać Cię do znajomych</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await acceptFriendRequest(req.id);
                    }}
                    className="flex-1"
                  >
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer">
                      Akceptuj
                    </button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await rejectFriendRequest(req.id);
                    }}
                    className="flex-1"
                  >
                    <button className="w-full bg-white border border-gray-200 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer">
                      Odrzuć
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. SEKCJA: ALERTY REZERWACJI (WSPÓLNE PREZENTY) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Gift size={14} /> Aktywność i rezerwacje
        </h2>

        {user.notifications.length === 0 && user.receivedRequests.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
            <Bell size={28} className="mx-auto text-gray-300" />
            <p className="text-sm font-medium text-gray-500">Nie masz jeszcze żadnych powiadomień.</p>
          </div>
        ) : user.notifications.length === 0 ? (
          <p className="text-xs text-gray-400 bg-gray-50 p-4 rounded-xl text-center">
            Brak powiadomień dotyczących rezerwacji marzeń.
          </p>
        ) : (
          <div className="space-y-2.5">
            {user.notifications.map((notif : any) => (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-colors flex items-center justify-between gap-3 ${
                  notif.isRead
                    ? "bg-white border-gray-100 text-gray-600"
                    : "bg-blue-50/60 border-blue-200 text-gray-900 shadow-sm"
                }`}
              >
                <div className="space-y-1">
                  {!notif.isRead && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                      Nowe
                    </span>
                  )}
                  <p className="text-sm leading-snug">{notif.message}</p>
                </div>

                {notif.link && (
                  <Link
                    href={notif.link}
                    className="p-2 bg-white border border-gray-200 hover:border-blue-300 rounded-xl text-blue-600 shrink-0 transition-colors"
                    title="Zobacz profil użytkownika"
                  >
                    <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}