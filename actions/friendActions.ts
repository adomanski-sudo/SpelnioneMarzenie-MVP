"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail, buildEmailTemplate } from "@/lib/mail";

// 1. WYSYŁANIE ZAPROSZENIA
export async function sendFriendRequest(formData: FormData) {
  // Weryfikacja sesji
  const session = await auth();
  if (!session?.user?.email) {
    return { error: "Musisz być zalogowany, aby wysłać zaproszenie." };
  }

  const receiverEmail = formData.get("email") as string;
  if (!receiverEmail) return { error: "Podaj adres e-mail." };

  if (receiverEmail === session.user.email) {
    return { error: "Nie możesz zaprosić samego siebie." };
  }

  // Wyszukanie użytkowników w bazie
  const sender = await prisma.user.findUnique({ where: { email: session.user.email } });
  const receiver = await prisma.user.findUnique({ where: { email: receiverEmail } });

  if (!sender || !receiver) {
    return { error: "Nie znaleziono użytkownika o podanym adresie e-mail." };
  }

  // Sprawdzenie, czy użytkownicy nie są już znajomymi
  const alreadyFriends = await prisma.user.findFirst({
    where: {
      id: sender.id,
      friends: { some: { id: receiver.id } } // Przeszukanie relacji
    }
  });

  if (alreadyFriends) {
    return { error: "Ten użytkownik jest już na Twojej liście znajomych." };
  }

  // Sprawdzenie, czy historia zaproszeń między tą parą już istnieje w bazie
  const previousRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: sender.id, receiverId: receiver.id },
        { senderId: receiver.id, receiverId: sender.id }
      ]
    }
  });

  if (previousRequest) {
    if (previousRequest.status === "PENDING") {
      return { error: "Zaproszenie między Wami już oczekuje na rozpatrzenie." };
    }
    
    // Jeśli zaproszenie było odrzucone (lub zaakceptowane, ale znajomość została usunięta),
    // "odnawiamy" je, nadpisując status i ustawiając aktualnego nadawcę i odbiorcę
    await prisma.friendRequest.update({
      where: { id: previousRequest.id },
      data: {
        status: "PENDING",
        senderId: sender.id,
        receiverId: receiver.id
      }
    });
  } else {
    // Jeśli w bazie jest zupełnie czysto, tworzymy nowe zaproszenie
    await prisma.friendRequest.create({
      data: {
        senderId: sender.id,
        receiverId: receiver.id,
      }
    });
  }

  const senderName = sender.name || sender.email;

  await sendEmail({
    to: receiver.email!,
    subject: `${senderName} zaprasza Cię do znajomych w SpełnioneMarzenie.pl`,
    html: buildEmailTemplate({
      heading: "Nowe zaproszenie do znajomych",
      message: `Użytkownik <strong>${senderName}</strong> wysłał Ci zaproszenie do grona znajomych. Zaakceptuj je, aby widzieć swoje prywatne marzenia i rezerwować prezenty!`,
      buttonText: "Zobacz zaproszenie",
      buttonPath: "/notifications",
    }),
  });

  revalidatePath("/");
  return { success: "Zaproszenie zostało wysłane!" };
}

// 2. AKCEPTACJA ZAPROSZENIA
export async function acceptFriendRequest(requestId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Brak autoryzacji");

  const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!currentUser) throw new Error("Błąd użytkownika");

  // Pobranie zaproszenia z upewnieniem się, że adresatem jest zalogowany użytkownik
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: true,
      receiver: true,
    },
  });

  if (!request || request.receiverId !== currentUser.id || request.status !== "PENDING") {
    throw new Error("Nieprawidłowe zaproszenie");
  }

  // Transakcja: Zapewnia, że jeśli jeden krok się nie powiedzie, cała operacja zostanie cofnięta
  await prisma.$transaction([
    // Zmiana statusu zaproszenia
    prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" }
    }),
    // Dodanie relacji u odbiorcy
    prisma.user.update({
      where: { id: request.receiverId },
      data: { friends: { connect: { id: request.senderId } } }
    }),
    // Dodanie relacji u nadawcy (aby znajomość była widoczna obustronnie)
    prisma.user.update({
      where: { id: request.senderId },
      data: { friends: { connect: { id: request.receiverId } } }
    })

  ]);

  const receiverName = request.receiver.name || request.receiver.email;

  // Powiadomienie w aplikacji dla osoby, której zaproszenie zaakceptowano
  await prisma.notification.create({
    data: {
      userId: request.senderId,
      message: `${receiverName} zaakceptował(a) Twoje zaproszenie do znajomych!`,
      link: `/friends/${request.receiverId}`,
    },
  });

  // Powiadomienie e-mail
  if (request.sender.email) {
    await sendEmail({
      to: request.sender.email,
      subject: `${receiverName} zaakceptował(a) Twoje zaproszenie!`,
      html: buildEmailTemplate({
        heading: "Jesteście teraz znajomymi!",
        message: `Użytkownik <strong>${receiverName}</strong> zaakceptował Twoje zaproszenie do znajomych. Możesz teraz przeglądać jego pełną listę marzeń.`,
        buttonText: "Zobacz listę marzeń",
        buttonPath: `/friends/${request.receiverId}`,
      }),
    });
  }

  revalidatePath("/friends");
}

// 3. ODRZUCENIE ZAPROSZENIA
export async function rejectFriendRequest(requestId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Brak autoryzacji");

  const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!currentUser) return;

  // Weryfikacja właściciela i zmiana statusu
  await prisma.friendRequest.update({
    where: { 
      id: requestId,
      receiverId: currentUser.id // Bezpiecznik na poziomie bazy
    },
    data: { status: "REJECTED" }
  });

  revalidatePath("/friends");
}

// 4. WYSYŁANIE ZAPROSZENIA BEZPOŚREDNIO Z PROFILU (po ID użytkownika)
export async function sendFriendRequestById(receiverId: string) {
  const session = await auth();
  if (!session?.user?.email) return;

  const sender = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { friends: true },
  });

  if (!sender || sender.id === receiverId) return;

  // Sprawdzamy, czy już nie są znajomymi
  const alreadyFriends = sender.friends.some((f) => f.id === receiverId);
  if (alreadyFriends) return;

  // Sprawdzamy historię zaproszeń między tą parą
  const previousRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: sender.id, receiverId: receiverId },
        { senderId: receiverId, receiverId: sender.id },
      ],
    },
  });

  if (previousRequest) {
    if (previousRequest.status === "PENDING") return;

    await prisma.friendRequest.update({
      where: { id: previousRequest.id },
      data: {
        status: "PENDING",
        senderId: sender.id,
        receiverId: receiverId,
      },
    });
  } else {
    await prisma.friendRequest.create({
      data: {
        senderId: sender.id,
        receiverId: receiverId,
      },
    });
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
  });

  if (receiver?.email) {
    const senderName = sender.name || sender.email;
    await sendEmail({
      to: receiver.email,
      subject: `${senderName} zaprasza Cię do znajomych w SpełnioneMarzenie.pl`,
      html: buildEmailTemplate({
        heading: "Nowe zaproszenie do znajomych",
        message: `Użytkownik <strong>${senderName}</strong> wysłał Ci zaproszenie do grona znajomych. Zaakceptuj je, aby widzieć swoje prywatne marzenia i rezerwować prezenty!`,
        buttonText: "Zobacz zaproszenie",
        buttonPath: "/notifications",
      }),
    });
  }

  revalidatePath(`/friends/${receiverId}`);
  revalidatePath("/friends");
}