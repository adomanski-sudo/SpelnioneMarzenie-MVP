"use client"; // To informuje Next.js, że ten kod działa w przeglądarce (może używać onClick i alertów)

import { reserveDreamAction } from "@/actions/dreamActions";

export default function ReserveButton({ dreamId, friendId }: { dreamId: string, friendId: string }) {
  const handleReservation = async () => {
    // Wywołujemy naszą bezpieczną funkcję serwerową
    const result = await reserveDreamAction(dreamId, friendId);
    
    if (result?.error) {
      // Jeśli serwer zwrócił błąd (np. marzenie zajęte), wyświetlamy go
      alert(result.error);
    }
  };

  return (
    <button 
      onClick={handleReservation}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm transition-colors"
    >
      Zarezerwuj
    </button>
  );
}