import { auth } from "@/auth";
import { addDreamAction } from "@/actions/dreamActions";
import Link from "next/link";
import { ArrowLeft, Sparkles, Link as LinkIcon, Lock, Globe } from "lucide-react";

  export const dynamic = "force-dynamic";

export default async function AddDreamPage() {
  const session = await auth();

  // Zabezpieczenie widoku przed niezalogowanymi gośćmi
  if (!session?.user) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-gray-600">Musisz być zalogowany, aby dodawać marzenia.</p>
        <Link href="/" className="inline-block text-blue-600 font-bold text-sm">
          &larr; Wróć na stronę główną
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Nagłówek z przyciskiem powrotu */}
      <div className="flex items-center gap-3 mb-6">
        <Link 
          href="/" 
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Nowe marzenie <Sparkles size={18} className="text-blue-600" />
          </h1>
          <p className="text-xs text-gray-500">Podziel się tym, co sprawi Ci radość</p>
        </div>
      </div>

      {/* Formularz dodawania */}
      <form action={addDreamAction} className="space-y-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        
        {/* 1. Nazwa marzenia */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            O czym marzysz? *
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="np. Czytnik Kindle Paperwhite 5"
            className="w-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none p-3 rounded-xl text-sm transition-colors"
          />
        </div>

        {/* 2. Kategoria */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Kategoria *
          </label>
          <select
            name="category"
            className="w-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none p-3 rounded-xl text-sm transition-colors"
          >
            <option value="CZAS">⏳ Czas (wspólne wyjście, wyjazd)</option>
            <option value="POMYSL">💡 Prezent - ogólny pomysł (np. worek bokserski)</option>
            <option value="KONKRET">🎯 Prezent - konkretny model</option>
            <option value="USMIECH">🍫 Uśmiech (drobiazg bez okazji)</option>
          </select>
        </div>

        {/* 3. Widoczność */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Kto może zobaczyć to marzenie?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 transition-colors">
              <input type="radio" name="visibility" value="PUBLIC" defaultChecked className="accent-blue-600" />
              <Globe size={16} className="text-blue-600" />
              <span className="text-xs font-bold text-gray-700">Wszyscy (Publiczne)</span>
            </label>

            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 transition-colors">
              <input type="radio" name="visibility" value="PRIVATE" className="accent-blue-600" />
              <Lock size={16} className="text-gray-600" />
              <span className="text-xs font-bold text-gray-700">Tylko znajomi</span>
            </label>
          </div>
        </div>

        {/* 4. Link do sklepu / aukcji */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Link do produktu / sklepu (opcjonalnie)
          </label>
          <div className="relative">
            <LinkIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              name="link"
              placeholder="https://allegro.pl/..."
              className="w-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none py-3 pl-10 pr-3 rounded-xl text-sm transition-colors"
            />
          </div>
        </div>

        {/* 5. Dodatkowy opis */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Dodatkowe wskazówki (opcjonalnie)
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="np. Kolor czarny, wersja bez reklam..."
            className="w-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none p-3 rounded-xl text-sm transition-colors resize-none"
          />
        </div>

        {/* Przycisk zatwierdzający */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-md shadow-blue-100"
        >
          Dodaj do mojej listy
        </button>

      </form>
    </div>
  );
}