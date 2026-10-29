// Plik: app/friends/[id]/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import ReserveButton from "@/components/ReserveButton";
import { cancelReservationAction } from "@/actions/dreamActions";
import { sendFriendRequestById, acceptFriendRequest } from "@/actions/friendActions";
import { Lock, ExternalLink, UserPlus, Check, Clock } from "lucide-react";

// export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function FriendProfilePage(props: Props) {
  const params = await props.params;
  const profileId = params.id;

  const session = await auth();
  let isFriend = false;
  let currentUserId: string | null = null;

  if (session?.user?.email) {
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { friends: true },
    });
    if (currentUser) {
      currentUserId = currentUser.id;
      // Jeśli kliknąłeś we własny kafelek, przenieś na /profile
      if (currentUserId === profileId) {
        redirect("/profile");
      }
      isFriend = currentUser.friends.some((f) => f.id === profileId);
    }
  }

  // Sprawdzamy, czy istnieje oczekujące zaproszenie między użytkownikami
  const pendingRequest = currentUserId
    ? await prisma.friendRequest.findFirst({
        where: {
          status: "PENDING",
          OR: [
            { senderId: currentUserId, receiverId: profileId },
            { senderId: profileId, receiverId: currentUserId },
          ],
        },
      })
    : null;

  // Pobieramy profil wybranego użytkownika wraz z jego marzeniami
  const profile : any = await prisma.user.findUnique({
    where: { id: profileId },
    include: {
      dreams: {
        where: {
          isFulfilled: false,
          visibility: isFriend ? undefined : "PUBLIC",
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!profile) notFound();

  const catColors: Record<string, string> = {
    CZAS: "bg-blue-100 text-blue-700",
    POMYSL: "bg-purple-100 text-purple-700",
    KONKRET: "bg-green-100 text-green-700",
    USMIECH: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="p-4 space-y-6">
      {/* KARTA WIZYTÓWKA UŻYTKOWNIKA */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          {profile.image ? (
            <img
              src={profile.image}
              alt={profile.name || ""}
              className="w-14 h-14 rounded-full object-cover border border-gray-200 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
              {profile.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold text-gray-900 truncate">{profile.name}</h1>
            <p className="text-xs text-gray-500 truncate">{profile.email}</p>
          </div>
        </div>

        {/* Status znajomości / Przycisk zaproszenia */}
        {currentUserId && (
          <div className="pt-3 border-t border-gray-50">
            {isFriend ? (
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 py-2 px-3 rounded-xl">
                <Check size={14} /> Twój znajomy (widzisz również marzenia prywatne)
              </div>
            ) : pendingRequest ? (
              pendingRequest.senderId === currentUserId ? (
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 py-2 px-3 rounded-xl">
                  <Clock size={14} /> Zaproszenie oczekuje na akceptację
                </div>
              ) : (
                <form action={async () => { "use server"; await acceptFriendRequest(pendingRequest.id); }}>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer">
                    Akceptuj zaproszenie do znajomych
                  </button>
                </form>
              )
            ) : (
              <form action={async () => { "use server"; await sendFriendRequestById(profile.id); }}>
                <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                  <UserPlus size={15} /> Dodaj do znajomych
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* SIATKA KAFELKÓW Z MARZENIAMI */}
      {profile.dreams.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-gray-500 text-sm">Brak dostępnych marzeń na tej liście.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.dreams.map((dream : any) => {
            const isReservedByMe = dream.reservedById === currentUserId;
            const showAsAvailable = !dream.reservedById || (dream.reservedById && !isReservedByMe);

            return (
              <div
                key={dream.id}
                className={`p-5 rounded-2xl shadow-sm border flex flex-col justify-between ${
                  isReservedByMe ? "bg-green-50/40 border-green-200" : "bg-white border-gray-100"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        catColors[dream.category] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {dream.category}
                    </span>
                    {dream.visibility === "PRIVATE" && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                        <Lock size={12} /> Prywatne
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2">{dream.title}</h3>

                  {dream.description && (
                    <p className="text-gray-500 text-sm mb-3">{dream.description}</p>
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

                {/* Sekcja akcji rezerwacji */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {!currentUserId ? (
                    <p className="text-xs text-gray-400 text-center">Zaloguj się, aby zarezerwować</p>
                  ) : isReservedByMe ? (
                    <form action={async () => { "use server"; await cancelReservationAction(dream.id, profile.id); }}>
                      <p className="text-green-700 text-xs font-bold mb-2 text-center">
                        ✓ Zarezerwowane przez Ciebie
                      </p>
                      <button className="w-full bg-white border border-green-300 hover:bg-green-50 text-green-800 font-bold py-2 rounded-xl text-xs transition-colors shadow-sm cursor-pointer">
                        Anuluj rezerwację
                      </button>
                    </form>
                  ) : (
                    showAsAvailable && <ReserveButton dreamId={dream.id} friendId={profile.id} />
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