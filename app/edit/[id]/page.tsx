import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { editDreamAction } from "@/actions/dreamActions";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Link as LinkIcon, Image as ImageIcon, Lock, Globe } from "lucide-react";

type Props = { params: Promise<{ id: string }> };

export default async function EditDreamPage(props: Props) {
  const params = await props.params;
  const dreamId = params.id;

  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!currentUser) redirect("/");

  const dream = await prisma.dream.findUnique({
    where: { id: dreamId },
  });

  // Jeśli marzenie nie istnieje lub należy do kogoś innego, zwracamy 404
  if (!dream || dream.authorId !== currentUser.id) {
    notFound();
  }

  return (
    <div className="p-4">
      {/* Nagłówek z przyciskiem powrotu */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/profile"
          className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Edytuj marzenie <Pencil size={18} className="text-blue-600" />
          </h1>
          <p className="text-xs text-gray-600">Wprowadź poprawki i zapisz zmiany</p>
        </div>
      </div>

      {/* Formularz edycji z wypełnionymi wartościami początkowymi */}
      <form
        action={async (formData: FormData) => {
          "use server";
          await editDreamAction(dream.id, formData);
        }}
        className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm"
      >
        {/* 1. Nazwa marzenia */}
        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
            O czym marzysz? *
          </label>
          <input
            type="text"
            name="title"
            required
            defaultValue={dream.title}
            placeholder="np. Czytnik Kindle Paperwhite 5"
            className="w-full border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-600 outline-none p-3 rounded-xl text-sm font-medium transition-colors"
          />
        </div>

        {/* 2. Kategoria */}
        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
            Kategoria *
          </label>
          <select
            name="category"
            defaultValue={dream.category}
            className="w-full border border-gray-300 bg-white text-gray-900 focus:border-blue-600 outline-none p-3 rounded-xl text-sm font-medium transition-colors"
          >
            <option value="CZAS">⏳ Czas (wspólne wyjście, wyjazd)</option>
            <option value="POMYSL">💡 Prezent - ogólny pomysł (np. worek bokserski)</option>
            <option value="KONKRET">🎯 Prezent - konkretny model</option>
            <option value="USMIECH">🍫 Uśmiech (drobiazg bez okazji)</option>
          </select>
        </div>

        {/* 3. Widoczność */}
        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
            Kto może zobaczyć to marzenie?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 transition-colors">
              <input
                type="radio"
                name="visibility"
                value="PUBLIC"
                defaultChecked={dream.visibility === "PUBLIC"}
                className="accent-blue-600"
              />
              <Globe size={16} className="text-blue-600 shrink-0" />
              <span className="text-xs font-bold text-gray-800">Wszyscy (Publiczne)</span>
            </label>

            <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 transition-colors">
              <input
                type="radio"
                name="visibility"
                value="PRIVATE"
                defaultChecked={dream.visibility === "PRIVATE"}
                className="accent-blue-600"
              />
              <Lock size={16} className="text-gray-700 shrink-0" />
              <span className="text-xs font-bold text-gray-800">Tylko znajomi</span>
            </label>
          </div>
        </div>

        {/* 4. Link do grafiki / zdjęcia */}
        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
            Link do zdjęcia / grafiki (opcjonalnie)
          </label>
          <div className="relative">
            <ImageIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="url"
              name="imageUrl"
              defaultValue={dream.imageUrl || ""}
              placeholder="https://.../zdjecie-produktu.jpg"
              className="w-full border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-600 outline-none py-3 pl-10 pr-3 rounded-xl text-sm font-medium transition-colors"
            />
          </div>
        </div>

        {/* 5. Link do sklepu / aukcji */}
        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
            Link do produktu / sklepu (opcjonalnie)
          </label>
          <div className="relative">
            <LinkIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="url"
              name="link"
              defaultValue={dream.link || ""}
              placeholder="https://allegro.pl/..."
              className="w-full border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-600 outline-none py-3 pl-10 pr-3 rounded-xl text-sm font-medium transition-colors"
            />
          </div>
        </div>

        {/* 6. Dodatkowy opis */}
        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
            Dodatkowe wskazówki (opcjonalnie)
          </label>
          <textarea
            name="description"
            rows={3}
            defaultValue={dream.description || ""}
            placeholder="np. Kolor czarny, wersja bez reklam..."
            className="w-full border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-600 outline-none p-3 rounded-xl text-sm font-medium transition-colors resize-none"
          />
        </div>

        {/* Przyciski zapisu i anulowania */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/profile"
            className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl text-sm transition-colors text-center"
          >
            Anuluj
          </Link>
          <button
            type="submit"
            className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-md shadow-blue-100 cursor-pointer"
          >
            Zapisz zmiany
          </button>
        </div>
      </form>
    </div>
  );
}