"use client";

import Link from "next/link";
import { fulfillDreamAction, deleteDreamAction } from "@/actions/dreamActions";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";

type Props = {
  dreamId: string;
  dreamTitle: string;
};

export default function DreamOwnerActions({ dreamId, dreamTitle }: Props) {
  const handleFulfill = async () => {
    const confirmed = window.confirm(
      `Czy na pewno chcesz oznaczyć marzenie „${dreamTitle}” jako spełnione?`
    );
    if (confirmed) {
      await fulfillDreamAction(dreamId);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Czy na pewno chcesz bezpowrotnie usunąć marzenie „${dreamTitle}”?`
    );
    if (confirmed) {
      await deleteDreamAction(dreamId);
    }
  };

  return (
    <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
      {/* 1. Oznacz jako spełnione */}
      <button
        type="button"
        onClick={handleFulfill}
        className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <CheckCircle2 size={14} /> Spełnione!
      </button>

      {/* 2. Edytuj marzenie */}
      <Link
        href={`/edit/${dreamId}`}
        title="Edytuj marzenie"
        className="bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 p-2 rounded-xl transition-colors flex items-center justify-center"
      >
        <Pencil size={16} />
      </Link>

      {/* 3. Usuń marzenie */}
      <button
        type="button"
        onClick={handleDelete}
        title="Usuń marzenie"
        className="bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 p-2 rounded-xl transition-colors cursor-pointer"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}