import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import DreamOwnerActions from "@/components/DreamOwnerActions";
import ProfileManagement from "@/components/ProfileManagement";
import { formatAge } from "@/lib/age";
import { Lock, ExternalLink, LogOut, Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ tab?: string }>;
};

export default async function ProfilePage(props: Props) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams?.tab || "ALL";
  const session = await auth();


  if (!session?.user?.email) {
    return (
      <div className="p-6 text-center space-y-4 mt-8">
        <h1 className="text-xl font-bold text-gray-800">Twój Profil</h1>
        <p className="text-gray-600 text-sm">
          Zaloguj się, aby zarządzać swoim profilem i listą marzeń.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm cursor-pointer">
            Zaloguj przez Google
          </button>
        </form>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      children: {
        orderBy: { createdAt: "asc" },
      },
      dreams: {
        include: { child: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) return <div className="p-4 text-center">Nie znaleziono profilu.</div>;

  const allActiveDreams = user.dreams.filter((d: any) => !d.isFulfilled);
  const activeDreams = allActiveDreams.filter((d: any) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "MINE") return d.childId === null;
    return d.childId === activeTab;
  });
  const fulfilledDreams = user.dreams.filter((d: any) => d.isFulfilled);

  const catColors: Record<string, string> = {
    CZAS: "bg-blue-100 text-blue-700",
    POMYSL: "bg-purple-100 text-purple-700",
    KONKRET: "bg-green-100 text-green-700",
    USMIECH: "bg-yellow-100 text-yellow-700",
  };

  const logoutForm = (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        title="Wyloguj się"
        className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
      >
        <LogOut size={18} />
      </button>
    </form>
  );

  return (
    <div className="p-4 space-y-6">
      {/* Wizytówka profilu z rozwijanymi panelami Edycji profilu oraz Profili dzieci */}
      <ProfileManagement user={user} logoutButton={logoutForm} />

      {user.children.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Link
            href="/profile?tab=ALL"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${activeTab === "ALL"
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
          >
            Wszystkie ({allActiveDreams.length})
          </Link>
          <Link
            href="/profile?tab=MINE"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${activeTab === "MINE"
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
          >
            Moje własne
          </Link>
          {user.children.map((child: any) => {
            const cAge = formatAge(child.birthDate);
            return (
              <Link
                key={child.id}
                href={`/profile?tab=${child.id}`}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${activeTab === child.id
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-white text-gray-800 border-gray-200 hover:bg-amber-50"
                  }`}
              >
                <span>🎈 {child.name}</span>
                {cAge && <span>({cAge})</span>}
              </Link>
            );
          })}
        </div>
      )}

      {/* Sekcja 1: Aktywne marzenia */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-md font-bold text-gray-800">
            Moje aktywne marzenia ({activeDreams.length})
          </h2>
          <Link
            href="/add"
            className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
          >
            <Plus size={14} /> Dodaj nowe
          </Link>
        </div>

        {activeDreams.length === 0 ? (
          <div className="text-center p-6 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-600 text-sm">Nie masz jeszcze żadnych aktywnych marzeń.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDreams.map((dream: any) => {
              const childAge = dream.child ? formatAge(dream.child.birthDate) : null;

              return (
                <div
                  key={dream.id}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${catColors[dream.category] || "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {dream.category}
                        </span>

                        {dream.child && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1.5">
                            {dream.child.image ? (
                              <img
                                src={dream.child.image}
                                alt={dream.child.name}
                                referrerPolicy="no-referrer"
                                className="w-4 h-4 rounded-full object-cover"
                              />
                            ) : (
                              <span>🎈</span>
                            )}
                            <span>
                              Dla: {dream.child.name}
                              {childAge ? ` (${childAge})` : ""}
                            </span>
                          </span>
                        )}
                      </div>

                      {dream.visibility === "PRIVATE" && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                          <Lock size={12} /> Prywatne
                        </span>
                      )}
                    </div>

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

                    <h3 className="font-bold text-gray-900 text-base leading-snug mb-2">
                      {dream.title}
                    </h3>

                    {dream.description && (
                      <p className="text-gray-600 text-xs mb-3">{dream.description}</p>
                    )}

                    {dream.link && (
                      <a
                        href={dream.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline mb-2"
                      >
                        <ExternalLink size={12} /> Link do produktu
                      </a>
                    )}
                  </div>

                  <DreamOwnerActions dreamId={dream.id} dreamTitle={dream.title} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sekcja 2: Archiwum spełnionych marzeń */}
      {fulfilledDreams.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">
            Spełnione marzenia ({fulfilledDreams.length})
          </h2>
          <div className="space-y-2">
            {fulfilledDreams.map((dream: any) => (
              <div
                key={dream.id}
                className="p-3 bg-white rounded-xl border border-gray-200 flex justify-between items-center opacity-75"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 line-through">
                    {dream.title}
                  </span>
                  {dream.child && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      🎈 {dream.child.name}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  Spełnione ✓
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}