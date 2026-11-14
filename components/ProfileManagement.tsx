"use client";

import { useState, useRef } from "react";
import {
  updateUserProfileAction,
  addChildAction,
  editChildAction,
  deleteChildAction,
} from "@/actions/dreamActions";
import { formatAge } from "@/lib/age";
import {
  Baby,
  Pencil,
  Trash2,
  Plus,
  Settings,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Camera,
  Link as LinkIcon,
   Loader2,
  Cake,
  X,
  Check,
} from "lucide-react";

type ChildItem = {
  id: string;
  name: string;
  birthDate: Date | string | null;
  image: string | null;
};

type Props = {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
    birthDate: Date | string | null;
    showAge: boolean;
    children: ChildItem[];
  };
  logoutButton: React.ReactNode;
};

// Wewnętrzny komponent wyboru i kompresji okrągłego awatara (Aparat / Galeria / Link)
function AvatarField({
  name,
  defaultValue = "",
  fallbackText = "?",
  label,
}: {
  name: string;
  defaultValue?: string | null;
  fallbackText?: string;
  label: string;
}) {
  const [imageUrl, setImageUrl] = useState<string>(defaultValue || "");
  const [isCompressing, setIsCompressing] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Przycinanie zdjęcia do centralnego kwadratu 300x300 px i kompresja do JPEG
  const compressSquareAvatar = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const SIZE = 300;
          canvas.width = SIZE;
          canvas.height = SIZE;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Błąd przetwarzania obrazu"));
            return;
          }

          const minSide = Math.min(img.width, img.height);
          const startX = (img.width - minSide) / 2;
          const startY = (img.height - minSide) / 2;

          ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, SIZE, SIZE);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };

        img.onerror = (err) => reject(err);
      };

      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedBase64 = await compressSquareAvatar(file);
      setImageUrl(compressedBase64);
    } catch {
      alert("Nie udało się przetworzyć zdjęcia. Spróbuj wybrać inne.");
    } finally {
      setIsCompressing(false);
      e.target.value = "";
    }
  };

  const isBase64 = imageUrl.startsWith("data:image/");

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
        {label}
      </label>

      {/* Ukryte pole formularza przesyłające Base64 lub link do akcji serwerowej */}
      <input type="hidden" name={name} value={imageUrl} />

      {/* Ukryte natywne pola wyboru pliku */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center gap-3.5">
        {/* Okrągły podgląd awatara */}
        <div className="relative w-14 h-14 rounded-full aspect-square shrink-0 border border-gray-200 bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg overflow-hidden">
          {isCompressing ? (
            <Loader2 size={18} className="animate-spin text-blue-600" />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Podgląd awatara"
              referrerPolicy="no-referrer"
              className="w-full h-full rounded-full aspect-square object-cover"
            />
          ) : (
            <span>{fallbackText}</span>
          )}
        </div>

        {/* Przyciski: Aparat, Galeria, Usuń */}
        <div className="flex-1 space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isCompressing}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-700 font-semibold text-xs transition-colors cursor-pointer active:scale-95"
            >
              <Camera size={14} />
              <span>Zrób zdjęcie</span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isCompressing}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs transition-colors cursor-pointer active:scale-95"
            >
              <ImageIcon size={14} />
              <span>Z galerii</span>
            </button>
          </div>

          {imageUrl && (
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
            >
              Usuń obecne zdjęcie
            </button>
          )}
        </div>
      </div>

      {/* Pole na zwykły link URL (ukrywane, gdy wybrano zdjęcie z telefonu) */}
      {!isBase64 && (
        <div className="relative">
          <LinkIcon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Lub wklej link: https://.../awatar.jpg"
            className="w-full border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-600 outline-none py-2 pl-8 pr-3 rounded-xl text-xs font-medium"
          />
        </div>
      )}
    </div>
  );
}

export default function ProfileManagement({ user, logoutButton }: Props) {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChildrenPanel, setShowChildrenPanel] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [newChildFormKey, setNewChildFormKey] = useState(0);

  const userAge = formatAge(user.birthDate);
  const formattedUserBirthDate = user.birthDate
    ? new Date(user.birthDate).toISOString().split("T")[0]
    : "";

  const handleDeleteChild = async (childId: string, childName: string) => {
    if (
      window.confirm(
        `Czy na pewno chcesz usunąć profil dziecka „${childName}” wraz z przypisanymi do niego marzeniami?`
      )
    ) {
      await deleteChildAction(childId);
    }
  };

  return (
    <div className="space-y-4">
      {/* GŁÓWNA KARTA PROFILU */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || ""}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full aspect-square object-cover border border-gray-200 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full aspect-square bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
                {user.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-gray-900 flex flex-wrap items-center gap-2">
                <span className="truncate">{user.name}</span>
                {user.showAge && userAge && (
                  <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
                    {userAge}
                  </span>
                )}
              </h1>
              <p className="text-xs text-gray-600 truncate">{user.email}</p>
            </div>
          </div>

          {logoutButton}
        </div>

        {/* Przyciski przełączające panele: Edytuj profil oraz Profile dzieci */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setShowEditProfile(!showEditProfile);
              if (!showEditProfile) setShowChildrenPanel(false);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${
              showEditProfile
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
            }`}
          >
            <Settings size={14} />
            <span>Edytuj profil</span>
            {showEditProfile ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowChildrenPanel(!showChildrenPanel);
              if (!showChildrenPanel) setShowEditProfile(false);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${
              showChildrenPanel
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
            }`}
          >
            <Baby size={15} />
            <span>Profile dzieci ({user.children.length})</span>
            {showChildrenPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* ROZWIJANY PANEL 1: EDYCJA GŁÓWNEGO PROFILU */}
      {showEditProfile && (
        <form
          action={async (formData) => {
            await updateUserProfileAction(formData);
            setShowEditProfile(false);
          }}
          className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 space-y-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Settings size={16} className="text-blue-600" />
              Ustawienia Twojego profilu
            </h2>
            <button
              type="button"
              onClick={() => setShowEditProfile(false)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Wybór awatara użytkownika (Aparat / Galeria / Link) */}
          <AvatarField
            name="userImage"
            defaultValue={user.image}
            fallbackText={user.name?.charAt(0).toUpperCase() || "?"}
            label="Zdjęcie profilowe / awatar"
          />

          {/* Data urodzenia i checkbox Pokaż wiek */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Cake size={13} className="text-blue-600" />
                Data urodzenia
              </label>
              <input
                type="date"
                name="userBirthDate"
                defaultValue={formattedUserBirthDate}
                className="w-full border border-gray-300 bg-white text-gray-900 focus:border-blue-600 outline-none p-2.5 rounded-xl text-xs font-medium"
              />
            </div>

            <label className="flex items-center gap-2.5 p-2.5 border border-gray-200 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                name="showAge"
                value="true"
                defaultChecked={user.showAge}
                className="h-4 w-4 accent-blue-600 rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-800">
                Pokaż mój wiek na profilu
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowEditProfile(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Zapisz zmiany
            </button>
          </div>
        </form>
      )}

      {/* ROZWIJANY PANEL 2: PROFILE DZIECI (Lista, Edycja, Dodawanie) */}
      {showChildrenPanel && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Baby size={18} className="text-blue-600" />
                Profile dzieci ({user.children.length})
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Zarządzaj profilami dzieci, aby tworzyć dla nich listy wymarzonych prezentów.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowChildrenPanel(false)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Lista dodanych dzieci */}
          {user.children.length > 0 && (
            <div className="space-y-2.5">
              {user.children.map((child) => {
                const childAge = formatAge(child.birthDate);
                const isEditing = editingChildId === child.id;
                const formattedChildBirth = child.birthDate
                  ? new Date(child.birthDate).toISOString().split("T")[0]
                  : "";

                if (isEditing) {
                  return (
                    <form
                      key={child.id}
                      action={async (formData) => {
                        await editChildAction(child.id, formData);
                        setEditingChildId(null);
                      }}
                      className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3"
                    >
                      <div className="text-xs font-bold text-blue-800">
                        Edycja profilu: {child.name}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          name="childName"
                          required
                          defaultValue={child.name}
                          placeholder="Imię dziecka *"
                          className="border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-600 outline-none p-2 rounded-xl text-xs font-medium"
                        />
                        <input
                          type="date"
                          name="birthDate"
                          defaultValue={formattedChildBirth}
                          className="border border-gray-300 bg-white text-gray-900 focus:border-blue-600 outline-none p-2 rounded-xl text-xs font-medium"
                        />
                      </div>

                      {/* Wybór awatara edytowanego dziecka */}
                      <AvatarField
                        name="childImage"
                        defaultValue={child.image}
                        fallbackText={child.name.charAt(0).toUpperCase()}
                        label="Awatar dziecka (opcjonalnie)"
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingChildId(null)}
                          className="bg-white border border-gray-300 text-gray-700 font-bold py-1.5 px-3 rounded-xl text-xs cursor-pointer"
                        >
                          Anuluj
                        </button>
                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={13} /> Zapisz
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div
                    key={child.id}
                    className="flex items-center justify-between bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-xl"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {child.image ? (
                        <img
                          src={child.image}
                          alt={child.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full aspect-square object-cover border border-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full aspect-square bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {child.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {child.name}
                        </span>
                        {childAge && (
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                            {childAge}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingChildId(child.id)}
                        title="Edytuj profil dziecka"
                        className="text-gray-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteChild(child.id, child.name)}
                        title="Usuń profil dziecka"
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Formularz dodawania nowego dziecka */}
          <form
            key={newChildFormKey}
            action={async (formData) => {
              await addChildAction(formData);
              setNewChildFormKey((prev) => prev + 1);
            }}
            className="pt-3 border-t border-gray-100 space-y-3"
          >
            <span className="block text-xs font-bold text-gray-700">
              Dodaj kolejne dziecko:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                name="childName"
                required
                placeholder="Imię dziecka *"
                className="border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-600 outline-none p-2.5 rounded-xl text-xs font-medium"
              />
              <input
                type="date"
                name="birthDate"
                title="Data urodzenia dziecka (opcjonalnie)"
                className="border border-gray-300 bg-white text-gray-900 focus:border-blue-600 outline-none p-2.5 rounded-xl text-xs font-medium"
              />
            </div>

            {/* Wybór awatara dla nowego dziecka */}
            <AvatarField
              name="childImage"
              fallbackText="🎈"
              label="Awatar dziecka (opcjonalnie)"
            />

            <button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Dodaj dziecko
            </button>
          </form>
        </div>
      )}
    </div>
  );
}