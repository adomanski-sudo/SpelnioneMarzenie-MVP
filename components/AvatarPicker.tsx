"use client";

import { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Link as LinkIcon, X, Loader2, User } from "lucide-react";

type Props = {
  name: string; // Nazwa pola w formularzu, np. "image" lub "childImage"
  defaultValue?: string | null;
  label?: string;
};

export default function AvatarPicker({
  name,
  defaultValue = "",
  label = "Zdjęcie profilowe (opcjonalnie)",
}: Props) {
  const [imageUrl, setImageUrl] = useState<string>(defaultValue || "");
  const [isCompressing, setIsCompressing] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Przycinanie do kwadratu 300x300 px (center crop) i kompresja do JPEG
  const compressAvatar = (file: File): Promise<string> => {
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

          // Wycinamy centralny kwadrat niezależnie od orientacji zdjęcia z telefonu
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
      const compressedBase64 = await compressAvatar(file);
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
    <div className="space-y-2.5">
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
        {label}
      </label>

      {/* Ukryte pole przekazywane do Server Action przy zapisie formularza */}
      <input type="hidden" name={name} value={imageUrl} />

      {/* Ukryte inputy dla aparatu i galerii */}
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

      <div className="flex items-center gap-4">
        {/* Okrągły podgląd awatara */}
        <div className="relative w-16 h-16 rounded-full aspect-square shrink-0 border border-gray-200 bg-blue-50 text-blue-600 flex items-center justify-center overflow-hidden">
          {isCompressing ? (
            <Loader2 size={20} className="animate-spin text-blue-600" />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Podgląd awatara"
              referrerPolicy="no-referrer"
              className="w-full h-full rounded-full aspect-square object-cover"
            />
          ) : (
            <User size={26} className="text-blue-400" />
          )}

          {imageUrl && !isCompressing && (
            <button
              type="button"
              onClick={() => setImageUrl("")}
              title="Usuń zdjęcie"
              className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 active:opacity-100 text-white flex items-center justify-center transition-opacity cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Przyciski wyboru źródła + usunięcia */}
        <div className="flex-1 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isCompressing}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Camera size={15} />
              <span>Aparat</span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isCompressing}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              <ImageIcon size={15} />
              <span>Galeria</span>
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

      {/* Opcjonalne pole na link z internetu (ukryte, gdy wybrano zdjęcie z telefonu) */}
      {!isBase64 && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <LinkIcon size={14} />
          </div>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Lub wklej link do grafiki: https://..."
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}