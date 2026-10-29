import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ReserveButton from "@/components/ReserveButton";
import { cancelReservationAction } from "@/actions/dreamActions";
import { Search, Users, Sparkles, Lock, ExternalLink, ArrowRight } from "lucide-react";

// export const dynamic = "force-dynamic";

// W Next.js 15 parametry z adresu URL (po znaku ?) są obiektem Promise
type Props = {
  searchParams: Promise<{
    q?: string;
    filter?: string; // "ALL" | "USERS" | "DREAMS"
    category?: string; // "ALL" | "CZAS" | "POMYSL" | "KONKRET" | "USMIECH"
  }>;
};

export default async function SearchPage(props: Props) {
  const searchParams = await props.searchParams;
  const query = searchParams.q?.trim() || "";
  const filter = searchParams.filter || "ALL";
  const category = searchParams.category || "ALL";

  // 1. Sprawdzamy, kto korzysta z wyszukiwarki (gość czy zalogowany)
  const session = await auth();
  let currentUserId: string | null = null;
  let friendIds: string[] = [];

  if (session?.user?.email) {
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { friends: true },
    });
    if (currentUser) {
      currentUserId = currentUser.id;
      friendIds = currentUser.friends.map((f) => f.id);
    }
  }

  // 2. WYSZUKIWANIE UŻYTKOWNIKÓW (po imieniu/nazwisku lub e-mailu)
  const shouldSearchUsers = (filter === "ALL" || filter === "USERS") && query.length > 0;
  const users = shouldSearchUsers
    ? await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
          ],
        },
        take: 10,
      })
    : [];

  // 3. WYSZUKIWANIE MARZEŃ (publiczne wszystkich + prywatne znajomych i własne)
  const shouldSearchDreams =
    (filter === "ALL" || filter === "DREAMS") && (query.length > 0 || category !== "ALL");

  const dreams = shouldSearchDreams
    ? await prisma.dream.findMany({
        where: {
          isFulfilled: false,
          // Filtrowanie po kategorii (jeśli wybrano konkretną)
          ...(category !== "ALL" ? { category: category as any } : {}),
          AND: [
            // Warunek A: Dopasowanie tekstu (w tytule lub opisie)
            query.length > 0
              ? {
                  OR: [
                    { title: { contains: query } },
                    { description: { contains: query } },
                  ],
                }
              : {},
            // Warunek B: Reguła widoczności (Publiczne LUB moje/znajomych)
            currentUserId
              ? {
                  OR: [
                    { visibility: "PUBLIC" },
                    { authorId: { in: [...friendIds, currentUserId] } },
                  ],
                }
              : { visibility: "PUBLIC" },
          ],
        },
        include: { author: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  const catColors: Record<string, string> = {
    CZAS: "bg-blue-100 text-blue-700",
    POMYSL: "bg-purple-100 text-purple-700",
    KONKRET: "bg-green-100 text-green-700",
    USMIECH: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="p-4 space-y-6">
      {/* FORMULARZ WYSZUKIWANIA */}
      <form action="/search" method="GET" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        {/* Pole tekstowe */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Szukaj osób (imię, e-mail) lub marzeń..."
            className="w-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none py-3 pl-10 pr-4 rounded-xl text-sm transition-colors"
          />
        </div>

        {/* Filtry: Co szukamy oraz Kategoria */}
        <div className="grid grid-cols-2 gap-2">
          <select
            name="filter"
            defaultValue={filter}
            className="border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none p-2.5 rounded-xl text-xs font-medium text-gray-700"
          >
            <option value="ALL">🔍 Wszystko (Osoby i Marzenia)</option>
            <option value="DREAMS">✨ Tylko marzenia</option>
            <option value="USERS">👥 Tylko użytkownicy</option>
          </select>

          <select
            name="category"
            defaultValue={category}
            className="border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none p-2.5 rounded-xl text-xs font-medium text-gray-700"
          >
            <option value="ALL">Wszystkie kategorie</option>
            <option value="CZAS">⏳ Czas</option>
            <option value="POMYSL">💡 Pomysł</option>
            <option value="KONKRET">🎯 Konkret</option>
            <option value="USMIECH">🍫 Uśmiech</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
        >
          Szukaj
        </button>
      </form>

      {/* STAN POCZĄTKOWY (Gdy nic jeszcze nie wpisano) */}
      {!query && category === "ALL" && (
        <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
          <Search size={32} className="mx-auto text-gray-300" />
          <p className="text-sm font-bold text-gray-600">Wpisz szukaną frazę lub wybierz kategorię</p>
          <p className="text-xs text-gray-400">
            Znajdziesz tutaj profil znajomego po imieniu i e-mailu albo odkryjesz, o czym marzą inni.
          </p>
        </div>
      )}

      {/* SEKCJA 1: WYNIKI DLA UŻYTKOWNIKÓW */}
      {shouldSearchUsers && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Users size={14} /> Znalezieni użytkownicy ({users.length})
          </h2>

          {users.length === 0 ? (
            <p className="text-xs text-gray-400 bg-gray-50 p-4 rounded-xl text-center">
              Brak użytkowników pasujących do zapytania „{query}”.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {users.map((u) => {
                const isMe = u.id === currentUserId;
                const isMyFriend = friendIds.includes(u.id);

                return (
                  <Link
                    key={u.id}
                    href={isMe ? "/profile" : `/friends/${u.id}`}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {u.image ? (
                        <img src={u.image} alt={u.name || ""} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {u.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      <div className="truncate">
                        <p className="font-bold text-gray-900 text-sm truncate">
                          {u.name} {isMe && <span className="text-xs font-normal text-gray-400">(Ty)</span>}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        {isMyFriend && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                            ✓ Twój znajomy
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-400 shrink-0 ml-2" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SEKCJA 2: WYNIKI DLA MARZEŃ */}
      {shouldSearchDreams && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} /> Znalezione marzenia ({dreams.length})
          </h2>

          {dreams.length === 0 ? (
            <p className="text-xs text-gray-400 bg-gray-50 p-4 rounded-xl text-center">
              Nie znaleziono żadnych marzeń spełniających te kryteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dreams.map((dream : any) => {
                const isMyDream = dream.authorId === currentUserId;
                const isReservedByMe = dream.reservedById === currentUserId;
                const showAsAvailable = !dream.reservedById || (dream.reservedById && !isReservedByMe);

                return (
                  <div key={dream.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <Link href={`/friends/${dream.authorId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-xs font-bold text-gray-500">
                            {dream.author.image ? (
                              <img src={dream.author.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              dream.author.name?.charAt(0).toUpperCase() || "?"
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{dream.author.name}</span>
                        </Link>

                        <div className="flex gap-1 items-center">
                          {dream.visibility === "PRIVATE" && <Lock size={12} className="text-gray-400" />}
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${catColors[dream.category] || "bg-gray-100 text-gray-700"}`}>
                            {dream.category}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2">{dream.title}</h3>

                      {dream.description && (
                        <p className="text-gray-500 text-sm line-clamp-2 mb-3">{dream.description}</p>
                      )}

                      {dream.link && (
                        <a
                          href={dream.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline mb-2"
                        >
                          <ExternalLink size={12} /> Zobacz link do produktu
                        </a>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-50">
                      {isMyDream ? (
                        <div className="text-center text-xs font-bold text-gray-400 p-2">To Twoje marzenie</div>
                      ) : !currentUserId ? (
                        <div className="text-center text-xs text-gray-400">Zaloguj się by zarezerwować</div>
                      ) : isReservedByMe ? (
                        <form action={async () => { "use server"; await cancelReservationAction(dream.id, dream.authorId); }}>
                          <p className="text-green-600 text-xs font-bold mb-2 text-center">✓ Zarezerwowane</p>
                          <button className="w-full bg-white border border-green-200 hover:bg-green-50 text-green-700 font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm">
                            Anuluj
                          </button>
                        </form>
                      ) : (
                        showAsAvailable && <ReserveButton dreamId={dream.id} friendId={dream.authorId} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}