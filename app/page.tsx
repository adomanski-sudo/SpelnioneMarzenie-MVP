import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ReserveButton from "@/components/ReserveButton";
import { cancelReservationAction } from "@/actions/dreamActions";
import Link from "next/link";
import { Lock, ExternalLink } from "lucide-react"; // Ikonka kłódki do prywatnych marzeń

export default async function Home() {
  const session = await auth();
  const currentUserId = session?.user?.email 
    ? (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id 
    : null;

  // Pobieramy "Tablicę Marzeń" (Feed)
  let feedDreams: any[] = [];

  if (currentUserId) {
    // ZALOGOWANY: Widzi swoje, oraz znajomych (zarówno PUBLIC i PRIVATE), oraz PUBLIC obcych (opcjonalnie)
    // Dla MVP uprośćmy: pokazujemy marzenia znajomych i swoje.
    const userWithFriends = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { friends: true }
    });

    const friendIds = userWithFriends?.friends.map(f => f.id) || [];
    
    feedDreams = await prisma.dream.findMany({
      where: {
        isFulfilled: false,
        OR: [
          { authorId: currentUserId }, // Moje
          { authorId: { in: friendIds } } // Znajomych
        ]
      },
      include: { author: true },
      orderBy: { createdAt: "desc" }
    });
  } else {
    // GOŚĆ: Widzi tylko 10 ostatnich PUBLICZNYCH marzeń
    feedDreams = await prisma.dream.findMany({
      where: { isFulfilled: false, visibility: "PUBLIC" },
      include: { author: true },
      orderBy: { createdAt: "desc" },
      take: 10
    });
  }

  return (
    <div className="p-4 space-y-4">

      {/* Siatka Kafelków (Card UI) */}
      {feedDreams.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-gray-500">Cisza... nikt jeszcze niczego nie pragnie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feedDreams.map((dream : any) => {
            const isMyDream = dream.authorId === currentUserId;
            const isReservedByMe = dream.reservedById === currentUserId;
            // Blef: Jeśli zarezerwował ktoś inny, pokazujemy jako wolne
            const showAsAvailable = !dream.reservedById || (dream.reservedById && !isReservedByMe);

            // Wybór koloru w zależności od kategorii
            const catColors: Record<string, string> = {
              "CZAS": "bg-blue-100 text-blue-700",
              "POMYSL": "bg-purple-100 text-purple-700",
              "KONKRET": "bg-green-100 text-green-700",
              "USMIECH": "bg-yellow-100 text-yellow-700"
            };

            return (
              <div key={dream.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                
                {/* Górna część kafelka */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <Link href={`/friends/${dream.authorId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                       <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                          {/* Tu w przyszłości wstawimy zdjęcie, na razie szary kółko z inicjałem */}
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                            {dream.author.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                       </div>
                       <span className="text-sm font-medium text-gray-700">{dream.author.name}</span>
                    </Link>
                    
                    {/* Etykieta kategorii */}
                    <div className="flex gap-1 items-center">
                       {dream.visibility === "PRIVATE" && <Lock size={12} className="text-gray-400" />}
                       <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${catColors[dream.category] || "bg-gray-100 text-gray-700"}`}>
                         {dream.category}
                       </span>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2">
                    {dream.title}
                  </h3>
                  
                  {dream.description && (
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                      {dream.description}
                    </p>
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

                {/* Dolna część kafelka (Akcje) */}
                <div className="mt-4 pt-4 border-t border-gray-50">
                  {isMyDream ? (
                    <div className="text-center text-xs font-bold text-gray-400 p-2">To Twoje marzenie</div>
                  ) : !currentUserId ? (
                     <div className="text-center text-xs text-gray-400">Zaloguj się by zarezerwować</div>
                  ) : isReservedByMe ? (
                    <form action={async () => { "use server"; await cancelReservationAction(dream.id, dream.authorId); }}>
                      <p className="text-green-600 text-xs font-bold mb-2 text-center flex items-center justify-center gap-1">
                        <span className="text-lg leading-none">✓</span> Zarezerwowane
                      </p>
                      <button className="w-full bg-white border border-green-200 hover:bg-green-50 text-green-700 font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm">
                        Anuluj
                      </button>
                    </form>
                  ) : showAsAvailable && (
                    <ReserveButton dreamId={dream.id} friendId={dream.authorId} />
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
