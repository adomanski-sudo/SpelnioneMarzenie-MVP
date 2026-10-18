import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest } from "@/actions/friendActions";
import Link from "next/link";

export default async function FriendsPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return <div className="p-4 text-center">Musisz być zalogowany.</div>;
  }

  // Pobieramy użytkownika wraz z jego znajomymi oraz oczekującymi zaproszeniami
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      friends: true,
      receivedRequests: {
        where: { status: "PENDING" },
        include: { sender: true } // Pobieramy dane nadawcy, by wiedzieć, kto zaprasza
      }
    }
  });

  if (!user) return <div className="p-4 text-center">Nie znaleziono użytkownika w bazie.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans">
      <div className="mx-auto max-w-md bg-white p-6 rounded-2xl shadow-lg">
        
        {/* Tymczasowa nawigacja powrotna */}
        <Link href="/" className="text-blue-500 text-sm mb-6 inline-block font-bold">
          &larr; Wróć do moich marzeń
        </Link>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Zarządzanie znajomymi</h1>

        {/* 1. SEKCJA: WYSYŁANIE ZAPROSZENIA */}
        <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <h2 className="text-md font-bold mb-3 text-blue-900">Zaproś kogoś</h2>
          <form action={sendFriendRequest} className="flex gap-2">
            <input 
              type="email" 
              name="email" 
              placeholder="Adres e-mail znajomego" 
              required 
              className="border border-gray-300 p-2 rounded-lg w-full text-sm"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
              Wyślij
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            *W wersji roboczej komunikaty o błędach (np. "taki e-mail nie istnieje") są ukryte.
          </p>
        </div>

        {/* 2. SEKCJA: OCZEKUJĄCE ZAPROSZENIA (widoczna tylko gdy są jakieś zaproszenia) */}
        {user.receivedRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-md font-bold mb-3 text-yellow-800">Oczekujące zaproszenia ({user.receivedRequests.length})</h2>
            <ul className="flex flex-col gap-3">
              {user.receivedRequests.map((request) => (
                <li key={request.id} className="p-3 border border-yellow-200 bg-yellow-50 rounded-xl flex flex-col gap-3">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{request.sender.name}</p>
                    <p className="text-xs text-gray-500">{request.sender.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <form action={async () => { "use server"; await acceptFriendRequest(request.id); }} className="flex-1">
                      <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg text-xs transition-colors">
                        Akceptuj
                      </button>
                    </form>
                    <form action={async () => { "use server"; await rejectFriendRequest(request.id); }} className="flex-1">
                      <button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg text-xs transition-colors">
                        Odrzuć
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. SEKCJA: TWOI ZNAJOMI */}
        <div>
          <h2 className="text-md font-bold mb-3 text-gray-800">Twoi znajomi ({user.friends.length})</h2>
          {user.friends.length === 0 ? (
            <p className="text-gray-500 text-sm">Nie masz jeszcze żadnych znajomych na liście.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {user.friends.map((friend) => (
        <li key={friend.id}>
          {/* Używamy komponentu Link, by przejść do profilu o id = friend.id */}
          <Link href={`/friends/${friend.id}`} className="p-3 border border-gray-100 bg-gray-50 hover:bg-blue-50 rounded-xl flex justify-between items-center transition-colors block">
            <div>
              <p className="font-bold text-gray-800 text-sm">{friend.name}</p>
              <p className="text-xs text-gray-500">{friend.email}</p>
            </div>
            <div className="text-blue-500 text-sm font-bold">&rarr;</div>
          </Link>
        </li>
      ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}