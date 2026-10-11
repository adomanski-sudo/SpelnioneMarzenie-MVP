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