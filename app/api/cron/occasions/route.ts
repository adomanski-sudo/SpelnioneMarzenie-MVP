import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildEmailTemplate } from "@/lib/mail";
import { HOLIDAYS, getDaysUntil, formatReminderTimeLabel } from "@/lib/occasions";

const BIRTHDAY_REMIND_DAYS = [30, 7, 1]; // Miesiąc, tydzień oraz dzień przed

export async function GET(request: Request) {
  // 1. Zabezpieczenie endpointu kluczem CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const secretParam = searchParams.get("secret");

  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    secretParam !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: "Brak autoryzacji!" }, { status: 401 });
  }

  const today = new Date();
  let emailsSent = 0;

  // 2. Pobieramy wszystkich użytkowników wraz z ich znajomymi oraz dziećmi
  const users = await prisma.user.findMany({
    include: {
      friends: {
        select: { id: true, name: true, email: true },
      },
      children: true,
    },
  });

  // --- CZĘŚĆ A: URODZINY UŻYTKOWNIKÓW ORAZ ICH DZIECI ---
  for (const user of users) {
    const userName = user.name || user.email || "Twój znajomy";

    // A1. Urodziny samego użytkownika
    if (user.birthDate && user.friends.length > 0) {
      const bDate = new Date(user.birthDate);
      const daysUntil = getDaysUntil(bDate.getMonth() + 1, bDate.getDate(), today);

      if (BIRTHDAY_REMIND_DAYS.includes(daysUntil)) {
        const timeLabel = formatReminderTimeLabel(daysUntil);

        // Powiadomienie w aplikacji (dzwoneczek) dla wszystkich znajomych
        await prisma.notification.createMany({
          data: user.friends.map((friend) => ({
            userId: friend.id,
            message: `🎂 Przypomnienie: ${timeLabel} urodziny obchodzi ${userName}! Sprawdź listę marzeń.`,
            link: `/friends/${user.id}`,
          })),
        });

        // Wysyłka e-maili do znajomych
        for (const friend of user.friends) {
          if (!friend.email) continue;

          await sendEmail({
            to: friend.email,
            subject: `🎂 Przypomnienie: ${userName} ma urodziny ${timeLabel}!`,
            html: buildEmailTemplate({
              heading: `Zbliżają się urodziny znajomego! 🎂`,
              message: `Przypominamy, że <strong>${timeLabel}</strong> swoje urodziny obchodzi <strong>${userName}</strong>. Zajrzyj na jego profil w SpełnioneMarzenie.pl i zarezerwuj prezent, zanim zrobi to ktoś inny!`,
              buttonText: `Zobacz marzenia (${userName})`,
              buttonPath: `/friends/${user.id}`,
            }),
          });
          emailsSent++;
        }
      }
    }

    // A2. Urodziny dzieci użytkownika (powiadamiamy znajomych rodzica)
    if (user.children.length > 0 && user.friends.length > 0) {
      for (const child of user.children) {
        if (!child.birthDate) continue;

        const cDate = new Date(child.birthDate);
        const daysUntil = getDaysUntil(cDate.getMonth() + 1, cDate.getDate(), today);

        if (BIRTHDAY_REMIND_DAYS.includes(daysUntil)) {
          const timeLabel = formatReminderTimeLabel(daysUntil);

          await prisma.notification.createMany({
            data: user.friends.map((friend) => ({
              userId: friend.id,
              message: `🎈 Przypomnienie: ${timeLabel} urodziny obchodzi ${child.name} (dziecko użytkownika ${userName})!`,
              link: `/friends/${user.id}?tab=${child.id}`,
            })),
          });

          for (const friend of user.friends) {
            if (!friend.email) continue;

            await sendEmail({
              to: friend.email,
              subject: `🎈 Przypomnienie: ${child.name} ma urodziny ${timeLabel}!`,
              html: buildEmailTemplate({
                heading: `Urodziny dziecka: ${child.name} 🎈`,
                message: `Przypominamy, że <strong>${timeLabel}</strong> urodziny obchodzi <strong>${child.name}</strong> (profil prowadzony przez: ${userName}). Zobacz aktualną listę wymarzonych prezentów!`,
                buttonText: `Zobacz marzenia: ${child.name}`,
                buttonPath: `/friends/${user.id}?tab=${child.id}`,
              }),
            });
            emailsSent++;
          }
        }
      }
    }
  }

  // --- CZĘŚĆ B: ŚWIĘTA KALENDARZOWE (OKAZJE) ---
  for (const holiday of HOLIDAYS) {
    const daysUntil = getDaysUntil(holiday.month, holiday.day, today);

    if (holiday.daysBefore.includes(daysUntil)) {
      const timeLabel = formatReminderTimeLabel(daysUntil);

      for (const user of users) {
        if (!user.email) continue;

        await sendEmail({
          to: user.email,
          subject: `${holiday.name} już ${timeLabel} – sprawdź listę marzeń!`,
          html: buildEmailTemplate({
            heading: holiday.heading,
            message: `Przypominamy, że <strong>${holiday.name}</strong> wypada <strong>${timeLabel}</strong>. ${holiday.message}`,
            buttonText: "Przejdź do aplikacji",
            buttonPath: "/",
          }),
        });
        emailsSent++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    checkedAt: today.toISOString(),
    emailsSent,
  });
}