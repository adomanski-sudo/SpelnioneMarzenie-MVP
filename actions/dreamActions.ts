"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addDreamAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Musisz być zalogowany, aby dodać marzenie.");
  }

  // 1. Pobieramy wszystkie pola z formularza (w tym opcjonalny imageUrl)
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const link = formData.get("link") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const category = formData.get("category") as "CZAS" | "POMYSL" | "KONKRET" | "USMIECH";
  const visibility = formData.get("visibility") as "PUBLIC" | "PRIVATE";

  if (!title || !category) return;

  // 2. Pobieramy autora wraz z listą ID jego znajomych
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      friends: {
        select: { id: true },
      },
    },
  });

  if (!user) throw new Error("Nie znaleziono użytkownika w bazie.");

  // 3. Zapisujemy nowe marzenie w bazie wraz z linkiem do grafiki
  await prisma.dream.create({
    data: {
      title,
      description: description?.trim() ? description.trim() : null,
      link: link?.trim() ? link.trim() : null,
      imageUrl: imageUrl?.trim() ? imageUrl.trim() : null,
      category,
      visibility: visibility || "PUBLIC",
      authorId: user.id,
    },
  });

  // 4. Rozsyłamy powiadomienie do wszystkich znajomych autora
  if (user.friends.length > 0) {
    const authorName = user.name || user.email;

    await prisma.notification.createMany({
      data: user.friends.map((friend: { id: string }) => ({
        userId: friend.id,
        message: `${authorName} dodał(a) nowe marzenie: „${title}”.`,
        link: `/friends/${user.id}`,
      })),
    });
  }

  // 5. Odświeżamy dane i wracamy na stronę główną
  revalidatePath("/");
  redirect("/");
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

    // NOWOŚĆ: Powiadamiamy osobę, która zarezerwowała ten prezent wcześniej!
    await prisma.notification.create({
      data: {
        userId: dream.reservedById, // Pierwszy rezerwujący
        message: `${currentUser.name || currentUser.email} również chciał(a) zarezerwować marzenie „${dream.title}”. Może połączycie siły przy wspólnym prezencie?`,
        link: `/friends/${currentUser.id}`, // Link do profilu tej osoby
      },
    });

    return { error: "Ktoś inny już zarezerwował to marzenie. Daliśmy mu znać, że też chciałeś je spełnić!" };
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

// OZNACZENIE MARZENIA JAKO SPEŁNIONE (Archiwizacja)
export async function fulfillDreamAction(dreamId: string) {
  const session = await auth();
  if (!session?.user?.email) return;

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!currentUser) return;

  await prisma.dream.update({
    where: {
      id: dreamId,
      authorId: currentUser.id, // Bezpiecznik: tylko autor może oznaczyć swoje marzenie
    },
    data: { isFulfilled: true },
  });

  revalidatePath("/");
  revalidatePath("/profile");
}

// USUNIĘCIE MARZENIA (Gdyby ktoś dodał coś przez pomyłkę)
export async function deleteDreamAction(dreamId: string) {
  const session = await auth();
  if (!session?.user?.email) return;

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!currentUser) return;

  await prisma.dream.delete({
    where: {
      id: dreamId,
      authorId: currentUser.id, // Bezpiecznik: tylko autor może usunąć
    },
  });

  revalidatePath("/");
  revalidatePath("/profile");
}

// OZNACZENIE POWIADOMIEŃ JAKO PRZECZYTANE
export async function markNotificationsAsReadAction() {
  const session = await auth();
  if (!session?.user?.email) return;

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!currentUser) return;

  await prisma.notification.updateMany({
    where: {
      userId: currentUser.id,
      isRead: false,
    },
    data: { isRead: true },
  });

  revalidatePath("/notifications");
  revalidatePath("/");
}