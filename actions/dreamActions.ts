"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addDreamAction(formData: FormData) {
  // 1. Weryfikacja sesji
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Musisz być zalogowany, aby dodać marzenie.");
  }

  // 2. Pobranie danych z formularza
  const title = formData.get("title") as string;
  const category = formData.get("category") as "CZAS" | "POMYSL" | "KONKRET" | "USMIECH";

  if (!title || !category) return;

  // 3. Wyszukanie ID użytkownika w bazie na podstawie e-maila
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) throw new Error("Nie znaleziono użytkownika w bazie.");

  // 4. Zapis nowego marzenia
  await prisma.dream.create({
    data: {
      title,
      category,
      authorId: user.id, // Przypisujemy marzenie do zalogowanego autora
      visibility: "PUBLIC",
    },
  });

  // 5. Odświeżenie widoku strony głównej (aby od razu wyświetlić nowe marzenie)
  revalidatePath("/");
}


export async function reserveDreamAction(dreamId: string, friendId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Brak autoryzacji");

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { friends: true } // Pobieramy listę znajomych do weryfikacji
  });

  if (!currentUser) return { error: "Nie znaleziono użytkownika." };

  // Weryfikacja: Czy użytkownik, którego marzenie chcemy zarezerwować, jest naszym znajomym?
  const isFriend = currentUser.friends.some(friend => friend.id === friendId);
  if (!isFriend) return { error: "Brak uprawnień. Nie jesteś znajomym tej osoby." };

  // Pobranie marzenia, aby sprawdzić jego aktualny status
  const dream = await prisma.dream.findUnique({ where: { id: dreamId } });
  if (!dream) return { error: "Marzenie nie istnieje." };

  // Logika sprawdzania, czy jest już zajęte
  if (dream.reservedById) {
    if (dream.reservedById === currentUser.id) {
      return { error: "To marzenie zostało już przez Ciebie zarezerwowane." };
    }
    return { error: "Ktoś inny już zarezerwował to marzenie." };
  }

  // Zapis w bazie danych
  await prisma.dream.update({
    where: { id: dreamId },
    data: { reservedById: currentUser.id }
  });

  revalidatePath(`/friends/${friendId}`);
}

// ANULOWANIE REZERWACJI (Opcjonalnie, gdy ktoś zmieni zdanie)
export async function cancelReservationAction(dreamId: string, friendId: string) {
  const session = await auth();
  if (!session?.user?.email) return;

  const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!currentUser) return;

  // Anulujemy tylko jeśli to zalogowany użytkownik jest tym, który wcześniej zarezerwował
  await prisma.dream.update({
    where: { 
      id: dreamId,
      reservedById: currentUser.id // Bezpiecznik na poziomie bazy
    },
    data: { reservedById: null } // Czyścimy pole rezerwacji
  });

  revalidatePath(`/friends/${friendId}`);
}