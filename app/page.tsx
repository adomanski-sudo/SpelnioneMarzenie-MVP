import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ReserveButton from "@/components/ReserveButton";
import { cancelReservationAction } from "@/actions/dreamActions";
import Link from "next/link";
import { Lock, ExternalLink } from "lucide-react";

export default async function Home() {
  const session = await auth();
  const currentUserId = session?.user?.email
    ? (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id
    : null;

  let feedDreams: any[] = [];

  if (currentUserId) {
    const userWithFriends = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { friends: true },
    });

    const friendIds = userWithFriends?.friends.map((f: any) => f.id) || [];

    feedDreams = await prisma.dream.findMany({
      where: {
        isFulfilled: false,
        OR: [{ authorId: currentUserId }, { authorId: { in: friendIds } }],
      },
      include: { author: true },
      orderBy: { createdAt: "desc" },
    });
  } else {
    feedDreams = await prisma.dream.findMany({
      where: { isFulfilled: false, visibility: "PUBLIC" },
      include: { author: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  }

  const catColors: Record<string, string> = {
    CZAS: "bg-blue-100 text-blue-700",
    POMYSL: "bg-purple-100 text-purple-700",
    KONKRET: "bg-green-100 text-green-700",
    USMIECH: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="p-4">
      {feedDreams.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-600">Cisza... nikt jeszcze niczego nie pragnie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feedDreams.map((dream: any) => {
            const isMyDream = dream.authorId === currentUserId;
            const isReservedByMe = dream.reservedById === currentUserId;
            const showAsAvailable = !dream.reservedById || (dream.reservedById && !isReservedByMe);

            return (
              <div
                key={dream.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"
              >
                <div>
                  {/* Nagłówek kafelka z awatarem autora i kategorią */}
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <Link
                      href={isMyDream ? "/profile" : `/friends/${dream.authorId}`}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
                    >
                      {dream.author.image ? (
                        <img
                          src={dream.author.image}
                          alt={dream.author.name || ""}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {dream.author.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      <span className="text-sm font-semibold text-gray-800 truncate">
                        {dream.author.name}
                      </span>
                    </Link>

                    <div className="flex gap-1 items-center shrink-0">
                      {dream.visibility === "PRIVATE" && <Lock size={12} className="text-gray-500" />}
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                          catColors[dream.category] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {dream.category}
                      </span>
                    </div>
                  </div>

                  {/* Grafika marzenia (jeśli dodana) */}
                  {dream.imageUrl && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 h-40 w-full">
                      <img
                        src={dream.imageUrl}
                        alt={dream.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2">{dream.title}</h3>

                  {dream.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{dream.description}</p>
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
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {isMyDream ? (
                    <div className="text-center text-xs font-bold text-gray-500 p-2">
                      To Twoje marzenie
                    </div>
                  ) : !currentUserId ? (
                    <div className="text-center text-xs text-gray-500">Zaloguj się by zarezerwować</div>
                  ) : isReservedByMe ? (
                    <form
                      action={async () => {
                        "use server";
                        await cancelReservationAction(dream.id, dream.authorId);
                      }}
                    >
                      <p className="text-green-700 text-xs font-bold mb-2 text-center">✓ Zarezerwowane</p>
                      <button className="w-full bg-white border border-green-300 hover:bg-green-50 text-green-800 font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm cursor-pointer">
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
  );
}