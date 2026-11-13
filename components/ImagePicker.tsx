"use client";

import { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Link as LinkIcon, X, Loader2 } from "lucide-react";

type Props = {
  defaultValue?: string | null;
};

export default function ImagePicker({ defaultValue = "" }: Props) {
  const [imageUrl, setImageUrl] = useState<string>(defaultValue || "");
  const [isCompressing, setIsCompressing] = useState(false);

  // Referencje do ukrytych pól wyboru pliku
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Funkcja zmniejszająca i kompresująca zdjęcie w przeglądarce za pomocą elementu <canvas>
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          let width = img.width;
          let height = img.height;

          // Zachowujemy oryginalne proporcje zdjęcia
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Błąd przetwarzania obrazu"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Konwersja do formatu JPEG z jakością 75% (zwraca gotowy ciąg Base64)
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
          resolve(compressedBase64);
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
      const compressedDataUrl = await compressImage(file);
      setImageUrl(compressedDataUrl);
    } catch (error) {
      alert("Nie udało się przetworzyć zdjęcia. Spróbuj wybrać inne.");
    } finally {
      setIsCompressing(false);
      e.target.value = ""; // Resetujemy input, by umożliwić ponowny wybór tego samego pliku
    }
  };

  const isBase64 = imageUrl.startsWith("data:image/");

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
        Zdjęcie / Grafika (opcjonalnie)
      </label>

      {/* Ukryte pole formularza, które przekazuje Base64 lub link do Server Action */}
      <input type="hidden" name="imageUrl" value={imageUrl} />

      {/* Ukryte natywne inputy dla aparatu i galerii */}
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

      {/* Dwa główne przyciski mobilne: Aparat oraz Galeria */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isCompressing}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-700 font-semibold text-xs transition-colors cursor-pointer active:scale-95"
        >
          <Camera size={18} />
          <span>Zrób zdjęcie</span>
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={isCompressing}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs transition-colors cursor-pointer active:scale-95"
        >
          <ImageIcon size={18} />
          <span>Z galerii</span>
        </button>
      </div>

      {/* Pole na zwykły link URL (widoczne, gdy nie wgrano zdjęcia z telefonu) */}
      {!isBase64 && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <LinkIcon size={16} />
          </div>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Lub wklej link: https://.../zdjecie.jpg"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Komunikat w trakcie kompresji */}
      {isCompressing && (
        <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
          <Loader2 size={16} className="animate-spin text-blue-600" />
          <span>Optymalizowanie zdjęcia...</span>
        </div>
      )}

      {/* Podgląd wybranego zdjęcia lub wklejonego linku z przyciskiem usunięcia */}
      {imageUrl && !isCompressing && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-44 w-full">
          <img
            src={imageUrl}
            alt="Podgląd marzenia"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => setImageUrl("")}
            title="Usuń zdjęcie"
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}