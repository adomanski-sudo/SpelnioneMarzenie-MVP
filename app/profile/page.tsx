import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fulfillDreamAction, deleteDreamAction } from "@/actions/dreamActions";
import { Lock, ExternalLink, CheckCircle2, Trash2, LogOut, Plus } from "lucide-react";
import Link from "next/link";



export default async function ProfilePage() {
  const session = await auth();

  // Widok dla niezalogowanego użytkownika
  if (!session?.user?.email) {
    return (
      <div className="p-6 text-center space-y-4 mt-8">
        <h1 className="text-xl font-bold text-gray-800">Twój Profil</h1>
        <p className="text-gray-500 text-sm">Zaloguj się, aby zarządzać swoim profilem i listą marzeń.</p>
        <form action={async () => { "use server"; await signIn("google"); }}>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm">
            Zaloguj przez Google
          </button>
        </form>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      dreams: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) return <div className="p-4 text-center">Nie znaleziono profilu.</div>;

  const activeDreams = user.dreams.filter((d) => !d.isFulfilled);
  const fulfilledDreams = user.dreams.filter((d) => d.isFulfilled);

  const catColors: Record<string, string> = {
    CZAS: "bg-blue-100 text-blue-700",
    POMYSL: "bg-purple-100 text-purple-700",
    KONKRET: "bg-green-100 text-green-700",
    USMIECH: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="p-4 space-y-6">
      {/* Karta nagłówkowa profilu (jak na wizualizacji) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {user.image ? (
            <img src={user.image} alt={user.name || ""} className="w-14 h-14 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
              {user.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-900">{user.name}</h1>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Przycisk wylogowania */}
        <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
          <button
            title="Wyloguj się"
            className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <LogOut size={18} />
          </button>
        </form>
      </div>

      {/* Sekcja 1: Aktywne marzenia */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-md font-bold text-gray-800">
            Moje aktywne marzenia ({activeDreams.length})
          </h2>
          <Link href="/add" className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
            <Plus size={14} /> Dodaj nowe
          </Link>
        </div>

        {activeDreams.length === 0 ? (
          <div className="text-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-gray-500 text-sm">Nie masz jeszcze żadnych aktywnych marzeń.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDreams.map((dream : any) => (
              <div key={dream.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${catColors[dream.category] || "bg-gray-100 text-gray-700"}`}>
                      {dream.category}
                    </span>
                    {dream.visibility === "PRIVATE" && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                        <Lock size={12} /> Prywatne
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 text-base leading-snug mb-2">
                    {dream.title}
                  </h3>

                  {dream.description && (
                    <p className="text-gray-500 text-xs mb-3">{dream.description}</p>
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

                {/* Przyciski zarządzania własnym marzeniem (Autor NIE widzi tu statusu rezerwacji!) */}
                <div className="mt-4 pt-3 border-t border-gray-50 flex gap-2">
                  <form action={async () => { "use server"; await fulfillDreamAction(dream.id); }} className="flex-1">
                    <button className="w-full bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={14} /> Spełnione!
                    </button>
                  </form>

                  <form action={async () => { "use server"; await deleteDreamAction(dream.id); }}>
                    <button
                      title="Usuń marzenie"
                      className="bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 p-2 rounded-xl transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sekcja 2: Archiwum spełnionych marzeń */}
      {fulfilledDreams.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            Spełnione marzenia ({fulfilledDreams.length})
          </h2>
          <div className="space-y-2">
            {fulfilledDreams.map((dream : any) => (
              <div key={dream.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center opacity-75">
                <span className="text-sm font-medium text-gray-700">{dream.title}</span>
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