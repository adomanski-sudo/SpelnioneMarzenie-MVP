import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addDreamAction } from "@/actions/dreamActions";

export default async function Home() {
  const session = await auth();

  // Pobranie marzeń tylko dla zalogowanego użytkownika
  let userDreams: any[] = [];
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        dreams: { orderBy: { createdAt: "desc" } } // Sortujemy od najnowszych
      }
    });
    if (user) {
      userDreams = user.dreams;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans">
      <div className="mx-auto max-w-md bg-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">SpełnioneMarzenie.pl</h1>
        
        {session ? (
          <div>
            {/* Sekcja profilu */}
            <div className="flex justify-between items-center mb-8 bg-gray-50 p-4 rounded-xl">
              <div>
                <p className="font-bold text-gray-900">{session.user?.name}</p>
                <p className="text-xs text-gray-500">{session.user?.email}</p>
              </div>
              <form action={async () => { "use server"; await signOut(); }}>
                <button className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors">
                  Wyloguj
                </button>
              </form>
            </div>

            {/* Formularz dodawania marzenia */}
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-3">Dodaj nowe marzenie</h2>
              <form action={addDreamAction} className="flex flex-col gap-3">
                <input 
                  type="text" 
                  name="title" 
                  placeholder="Co Ci się marzy?" 
                  required 
                  className="border border-gray-300 p-3 rounded-xl w-full text-sm"
                />
                <select name="category" className="border border-gray-300 p-3 rounded-xl w-full text-sm bg-white">
                  <option value="CZAS">Czas (np. wycieczka w góry)</option>
                  <option value="POMYSL">Pomysł (np. worek bokserski!)</option>
                  <option value="KONKRET">Konkret (dokładny model/link)</option>
                  <option value="USMIECH">Uśmiech (drobiazg bez okazji)</option>
                </select>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
                  Dodaj do listy
                </button>
              </form>
            </div>

            {/* Lista marzeń */}
            <div>
              <h2 className="text-lg font-bold mb-3">Twoje marzenia ({userDreams.length})</h2>
              {userDreams.length === 0 ? (
                <p className="text-gray-500 text-sm">Nie masz jeszcze żadnych marzeń. Dodaj pierwsze powyżej ↑</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {userDreams.map((dream) => (
                    <li key={dream.id} className="p-4 border border-gray-100 bg-gray-50 rounded-xl shadow-sm">
                      <p className="font-bold text-gray-800">{dream.title}</p>
                      <span className="inline-block mt-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md">
                        {dream.category}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-6">Zaloguj się, aby tworzyć swoją listę.</p>
            <form action={async () => { "use server"; await signIn("google"); }}>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors">
                Zaloguj przez Google
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}