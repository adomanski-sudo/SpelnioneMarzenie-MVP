"use client";

import { useState } from "react";
import { Users, Gift } from "lucide-react";

type ChildItem = {
  id: string;
  name: string;
};

type Props = {
  childrenList: ChildItem[];
  defaultChildId?: string | null;
  defaultReservedByMe?: boolean;
  isReservedBySomeoneElse?: boolean;
};

export default function DreamRecipientSelector({
  childrenList,
  defaultChildId = "",
  defaultReservedByMe = false,
  isReservedBySomeoneElse = false,
}: Props) {
  const [selectedChildId, setSelectedChildId] = useState<string>(defaultChildId || "");
  const [reservedByMe, setReservedByMe] = useState<boolean>(defaultReservedByMe);

  // Jeśli użytkownik nie dodał jeszcze żadnych profili dzieci, nie wyświetlamy pola wyboru
  if (childrenList.length === 0) {
    return null;
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && isReservedBySomeoneElse) {
      alert("Ktoś z Twoich znajomych już zarezerwował ten prezent dla dziecka!");
      setReservedByMe(false);
      return;
    }
    setReservedByMe(e.target.checked);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
          Dla kogo jest to marzenie?
        </label>
        <div className="relative">
          <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <select
            name="childId"
            value={selectedChildId}
            onChange={(e) => {
              setSelectedChildId(e.target.value);
              if (!e.target.value) setReservedByMe(false);
            }}
            className="w-full border border-gray-300 bg-white text-gray-900 focus:border-blue-600 outline-none py-3 pl-10 pr-3 rounded-xl text-sm font-medium transition-colors"
          >
            <option value="">Dla mnie (Moje własne marzenie)</option>
            {childrenList.map((child) => (
              <option key={child.id} value={child.id}>
                Prezent dla: {child.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Checkbox pojawia się tylko wtedy, gdy wybrano któreś dziecko */}
      {selectedChildId !== "" && (
        <label className="flex items-start gap-3 p-3.5 border border-blue-200 bg-blue-50/60 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
          <input
            type="checkbox"
            name="reserveForMe"
            value="true"
            checked={reservedByMe}
            onChange={handleCheckboxChange}
            className="mt-0.5 h-4 w-4 accent-blue-600 rounded cursor-pointer"
          />
          <div className="text-xs">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <Gift size={14} className="text-blue-600" />
              Rezerwuję to marzenie (kupię je sam/a)
            </span>
            <p className="text-gray-600 mt-0.5">
              Dziecko zobaczy prezent na swojej liście, ale rodzina otrzyma informację, że jest już zajęty.
            </p>
          </div>
        </label>
      )}
    </div>
  );
}