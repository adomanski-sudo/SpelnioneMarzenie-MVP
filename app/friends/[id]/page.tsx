import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReserveButton from "@/components/ReserveButton";
import { cancelReservationAction } from "@/actions/dreamActions";

type Props = { params: Promise<{ id: string }> };

export default async function FriendProfilePage(props: Props) {
  const params = await props.params;
  const profileId = params.id;
  
  // 1. Sprawdzamy status odwiedzającego (gość czy zalogowany znajomy?)
  const session = await auth();
  let isFriend = false;
  let currentUserId: string | null = null;

  if (session?.user?.email) {
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { friends: true }
    });
    if (currentUser) {
      currentUserId = currentUser.id;
      // Profil jest mój LUB jesteśmy znajomymi
      isFriend = (currentUserId === profileId) || currentUser.friends.some(f => f.id === profileId);
    }
  }

  // 2. Pobieramy profil. Magia Prismy: od razu filtrujemy marzenia na poziomie zapytania SQL!
  const profile = await prisma.user.findUnique({
    where: { id: profileId },
    include: { 
      dreams: { 
        where: { 
          isFulfilled: false,
          // Jeśli jesteś znajomym (lub to Twój profil), pobierz wszystko (undefined nie filtruje).
          // Jeśli jesteś gościem, wymuś pobranie tylko PUBLIC.
          visibility: isFriend ? undefined : "PUBLIC"
        },
        orderBy: { createdAt: "desc" }
      } 
    }
  });

  if (!profile) notFound();

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans">
      <div className="mx-auto max-w-md bg-white p-6 rounded-2xl shadow-lg">
        {currentUserId && (
          <Link href="/friends" className="text-blue-500 text-sm mb-6 inline-block font-bold">
            &larr; Wróć do listy znajomych
          </Link>
        )}
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Marzenia: {profile.name}</h1>
        <p className="text-sm text-gray-500 mb-8">{profile.email}</p>

        {profile.dreams.length === 0 ? (
          <p className="text-gray-500 text-sm">Brak dostępnych marzeń na tej liście.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {profile.dreams.map((dream) => {
              const isReservedByMe = dream.reservedById === currentUserId;
              // Ważne: Jeśli zarezerwował ktoś inny, z perspektywy UI traktujemy je jak wolne (blefujemy!)
              const showAsAvailable = !dream.reservedById || (dream.reservedById && !isReservedByMe);

              return (
                <li key={dream.id} className={`p-4 border rounded-xl shadow-sm ${
                  isReservedByMe ? "border-green-300 bg-green-50" : "border-gray-100 bg-gray-50"
                }`}>
                  <p className="font-bold text-gray-800 text-lg">{dream.title}</p>
                  <div className="flex gap-2 mt-2 mb-4">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md">
                      {dream.category}
                    </span>
                    {dream.visibility === "PRIVATE" && (
                      <span className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-md">
                        🔒 Prywatne
                      </span>
                    )}
                  </div>

                  {/* Krok 2: Jeśli jesteśmy obcym/znajomym i marzenie z pozoru jest dostępne */}
                  {showAsAvailable && currentUserId && currentUserId !== profileId && (
                    <ReserveButton dreamId={dream.id} friendId={profile.id} />
                  )}

                  {/* Jeśli to ja zarezerwowałem, pozwól mi zrezygnować */}
                  {isReservedByMe && (
                    <form action={async () => { "use server"; await cancelReservationAction(dream.id, profile.id); }}>
                      <p className="text-green-700 text-xs font-bold mb-2 text-center">✓ Zarezerwowane przez Ciebie</p>
                      <button className="w-full bg-white border border-green-300 hover:bg-green-100 text-green-800 font-bold py-2 rounded-lg text-sm transition-colors">
                        Anuluj rezerwację
                      </button>
                    </form>
                  )}
                  
                  {/* Komunikat dla niezalogowanych */}
                  {!currentUserId && (
                    <p className="text-xs text-gray-500 text-center mt-2">Zaloguj się, aby rezerwować.</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}