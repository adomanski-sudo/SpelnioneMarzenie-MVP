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

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const link = formData.get("link") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const category = formData.get("category") as "CZAS" | "POMYSL" | "KONKRET" | "USMIECH";
  const visibility = formData.get("visibility") as "PUBLIC" | "PRIVATE";
  
  // NOWOŚĆ: Odbiorca (dziecko) oraz rezerwacja własna rodzica
  const rawChildId = formData.get("childId") as string;
  const reserveForMe = formData.get("reserveForMe") === "true";

  if (!title || !category) return;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      children: true,
      friends: { select: { id: true } },
    },
  });

  if (!user) throw new Error("Nie znaleziono użytkownika w bazie.");

  // Weryfikujemy, czy wybrane dziecko faktycznie należy do zalogowanego rodzica
  const validChild = user.children.find((c) => c.id === rawChildId);
  const childId = validChild ? validChild.id : null;

  await prisma.dream.create({
    data: {
      title: title.trim(),
      description: description?.trim() ? description.trim() : null,
      link: link?.trim() ? link.trim() : null,
      imageUrl: imageUrl?.trim() ? imageUrl.trim() : null,
      category,
      visibility: visibility || "PUBLIC",
      authorId: user.id,
      childId,
      // Jeśli marzenie jest dla dziecka i rodzic zaznaczył checkbox, przypisujemy rezerwację rodzicowi
      reservedById: childId && reserveForMe ? user.id : null,
    },
  });

  if (user.friends.length > 0) {
    const authorName = user.name || user.email;
    const notifMessage = validChild
      ? `${authorName} dodał(a) nowe marzenie dla dziecka (${validChild.name}): „${title}”.`
      : `${authorName} dodał(a) nowe marzenie: „${title}”.`;

    await prisma.notification.createMany({
      data: user.friends.map((friend: { id: string }) => ({
        userId: friend.id,
        message: notifMessage,
        link: `/friends/${user.id}`,
      })),
    });
  }

  revalidatePath("/");
  revalidatePath("/profile");
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


// EDYCJA ISTNIEJĄCEGO MARZENIA
export async function editDreamAction(dreamId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Musisz być zalogowany, aby edytować marzenie.");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const link = formData.get("link") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const category = formData.get("category") as "CZAS" | "POMYSL" | "KONKRET" | "USMIECH";
  const visibility = formData.get("visibility") as "PUBLIC" | "PRIVATE";

  const rawChildId = formData.get("childId") as string;
  const reserveForMe = formData.get("reserveForMe") === "true";

  if (!title || !category) return;

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { children: true },
  });

  if (!currentUser) throw new Error("Nie znaleziono użytkownika.");

  const existingDream = await prisma.dream.findUnique({
    where: { id: dreamId },
  });

  if (!existingDream || existingDream.authorId !== currentUser.id) {
    throw new Error("Brak uprawnień do edycji tego marzenia.");
  }

  const validChild = currentUser.children.find((c) => c.id === rawChildId);
  const childId = validChild ? validChild.id : null;

  // Bezpieczne wyliczenie nowego stanu reservedById (chroni rezerwację innych członków rodziny!)
  let updatedReservedById = existingDream.reservedById;

  if (!childId) {
    // Jeśli marzenie zmieniono na osobiste marzenie rodzica, rodzic nie może go sam sobie rezerwować
    if (existingDream.reservedById === currentUser.id) {
      updatedReservedById = null;
    }
  } else {
    // Marzenie należy do dziecka: modyfikujemy rezerwację tylko wtedy, gdy nikt inny jej wcześniej nie zajął
    const isReservedByOther =
      existingDream.reservedById !== null && existingDream.reservedById !== currentUser.id;

    if (!isReservedByOther) {
      updatedReservedById = reserveForMe ? currentUser.id : null;
    }
  }

  await prisma.dream.update({
    where: {
      id: dreamId,
      authorId: currentUser.id,
    },
    data: {
      title: title.trim(),
      description: description?.trim() ? description.trim() : null,
      link: link?.trim() ? link.trim() : null,
      imageUrl: imageUrl?.trim() ? imageUrl.trim() : null,
      category,
      visibility: visibility || "PUBLIC",
      childId,
      reservedById: updatedReservedById,
    },
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/search");
  redirect("/profile");
}

// EDYCJA GŁÓWNEGO PROFILU UŻYTKOWNIKA
export async function updateUserProfileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return;

  const rawBirthDate = formData.get("userBirthDate") as string;
  const image = (formData.get("userImage") as string)?.trim();
  const showAge = formData.get("showAge") === "true";

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      image: image ? image : null,
      birthDate: rawBirthDate ? new Date(rawBirthDate) : null,
      showAge,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/friends");
  revalidatePath("/search");
}

// Zażądzanie profilami dzieci

export async function addChildAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return;

  const name = (formData.get("childName") as string)?.trim();
  const rawBirthDate = formData.get("birthDate") as string;
  const image = (formData.get("childImage") as string)?.trim();

  if (!name) return;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return;

  await prisma.child.create({
    data: {
      name,
      birthDate: rawBirthDate ? new Date(rawBirthDate) : null,
      image: image ? image : null,
      parentId: user.id,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/add");
}

export async function deleteChildAction(childId: string) {
  const session = await auth();
  if (!session?.user?.email) return;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return;

  await prisma.child.delete({
    where: {
      id: childId,
      parentId: user.id,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/add");
  revalidatePath("/");
}

export async function updateUserBirthDateAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return;

  const rawBirthDate = formData.get("userBirthDate") as string;

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      birthDate: rawBirthDate ? new Date(rawBirthDate) : null,
    },
  });

  revalidatePath("/profile");
}

export async function editChildAction(childId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return;

  const name = (formData.get("childName") as string)?.trim();
  const rawBirthDate = formData.get("birthDate") as string;
  const image = (formData.get("childImage") as string)?.trim();

  if (!name) return;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return;

  await prisma.child.update({
    where: {
      id: childId,
      parentId: user.id, // Bezpiecznik: tylko rodzic może edytować profil dziecka
    },
    data: {
      name,
      birthDate: rawBirthDate ? new Date(rawBirthDate) : null,
      image: image ? image : null,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/add");
  revalidatePath("/");
}