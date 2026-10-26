import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest } from "@/actions/friendActions";
import Link from "next/link";
import { Users, UserPlus, ArrowRight, Bell } from "lucide-react";

//  export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <div className="p-6 text-center space-y-3 mt-8">
        <Users size={36} className="mx-auto text-gray-300" />
        <h1 className="text-lg font-bold text-gray-800">Twoi Znajomi</h1>
        <p className="text-gray-500 text-sm">
          Zaloguj się przyciskiem w prawym górnym rogu, aby zarządzać listą znajomych.
        </p>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      friends: true,
      receivedRequests: {
        where: { status: "PENDING" },
        include: { sender: true },
      },
    },
  });

  if (!user) return <div className="p-4 text-center">Nie znaleziono użytkownika.</div>;

  return (
    <div className="p-4 space-y-6">
      {/* 1. SEKCJA: SZYBKIE ZAPROSZENIE PO E-MAILU */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <UserPlus size={14} className="text-blue-600" /> Zaproś znajomego po adresie e-mail
        </h2>
        <form
          action={async (formData) => {
            "use server";
            await sendFriendRequest(formData);
          }}
          className="flex gap-2"
        >
          <input
            type="email"
            name="email"
            placeholder="np. jan.kowalski@gmail.com"
            required
            className="border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none p-2.5 rounded-xl w-full text-sm transition-colors"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shrink-0 cursor-pointer"
          >
            Wyślij
          </button>
        </form>
      </div>

      {/* 2. SEKCJA: OCZEKUJĄCE ZAPROSZENIA */}
      {user.receivedRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <Bell size={14} /> Oczekujące zaproszenia ({user.receivedRequests.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {user.receivedRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 border border-amber-200 bg-amber-50/60 rounded-2xl flex flex-col gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                    {request.sender.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-gray-900 text-sm truncate">{request.sender.name}</p>
                    <p className="text-xs text-gray-500 truncate">{request.sender.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await acceptFriendRequest(request.id);
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
                      await rejectFriendRequest(request.id);
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

      {/* 3. SEKCJA: KAFELKI ZNAJOMYCH */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Users size={14} /> Twoi znajomi ({user.friends.length})
        </h2>

        {user.friends.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
            <p className="text-gray-500 text-sm">Nie masz jeszcze żadnych znajomych na liście.</p>
            <Link href="/search" className="inline-block text-xs font-bold text-blue-600 hover:underline">
              Użyj wyszukiwarki, aby znaleźć znajomych &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {user.friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/friends/${friend.id}`}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {friend.image ? (
                    <img
                      src={friend.image}
                      alt={friend.name || ""}
                      className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {friend.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="font-bold text-gray-900 text-sm truncate">{friend.name}</p>
                    <p className="text-xs text-gray-500 truncate">{friend.email}</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400 shrink-0 ml-2" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}