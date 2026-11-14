export type HolidayConfig = {
  id: string;
  name: string;
  month: number; // 1 = Styczeń, 12 = Grudzień
  day: number;
  daysBefore: number[]; // Z jakim wyprzedzeniem (w dniach) wysyłać przypomnienie
  heading: string;
  message: string;
};

export const HOLIDAYS: HolidayConfig[] = [
  {
    id: "dzien-babci",
    name: "Dzień Babci",
    month: 1,
    day: 21,
    daysBefore: [7, 1],
    heading: "Zbliża się Dzień Babci (21 stycznia) 💐",
    message: "To świetny moment, aby sprawdzić marzenia bliskich lub podpowiedzieć rodzinie pomysły na wspólny prezent.",
  },
  {
    id: "dzien-dziadka",
    name: "Dzień Dziadka",
    month: 1,
    day: 22,
    daysBefore: [7, 1],
    heading: "Zbliża się Dzień Dziadka (22 stycznia) 🎁",
    message: "Pamiętaj o święcie Dziadka! Zajrzyj na listy marzeń swoich bliskich w aplikacji.",
  },
  {
    id: "dzien-matki",
    name: "Dzień Matki",
    month: 5,
    day: 26,
    daysBefore: [7, 1],
    heading: "Zbliża się Dzień Matki (26 maja) 🌷",
    message: "Sprawdź w SpełnioneMarzenie.pl, o czym marzy Twoja Mama, i zarezerwuj prezent z wyprzedzeniem!",
  },
  {
    id: "dzien-dziecka",
    name: "Dzień Dziecka",
    month: 6,
    day: 1,
    daysBefore: [14, 7, 1],
    heading: "Zbliża się Dzień Dziecka (1 czerwca) 🎈",
    message: "Sprawdź marzenia dzieci swoich bliskich lub zaktualizuj profile własnych pociech, aby ułatwić rodzinie wybór prezentu!",
  },
  {
    id: "dzien-ojca",
    name: "Dzień Ojca",
    month: 6,
    day: 23,
    daysBefore: [7, 1],
    heading: "Zbliża się Dzień Ojca (23 czerwca) 🎉",
    message: "Zajrzyj do aplikacji i zobacz, jaki prezent lub wspólne wyjście sprawi największą radość Twojemu Tacie.",
  },
  {
    id: "dzien-nauczyciela",
    name: "Dzień Nauczyciela",
    month: 10,
    day: 14,
    daysBefore: [7, 1],
    heading: "Zbliża się Dzień Nauczyciela (14 października) 📚",
    message: "Pamiętaj o zbliżającym się Dniu Edukacji Narodowej – to dobra okazja na drobny upominek z kategorii Uśmiech!",
  },
  {
    id: "boze-narodzenie",
    name: "Boże Narodzenie",
    month: 12,
    day: 24,
    daysBefore: [30, 7],
    heading: "Święta Bożego Narodzenia coraz bliżej! 🎄",
    message: "Uzupełnij swoją listę marzeń oraz listy swoich dzieci i sprawdź, o czym marzą Twoi bliscy, zanim najlepsze pomysły zostaną zarezerwowane!",
  },
];

// Funkcja licząca ile dni zostało od dzisiaj do najbliższego wystąpienia (miesiąc, dzień)
export function getDaysUntil(month: number, day: number, referenceDate = new Date()): number {
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  let nextOccurrence = new Date(today.getFullYear(), month - 1, day);

  // Jeśli w tym roku ta data już minęła, sprawdzamy kolejny rok
  if (nextOccurrence < today) {
    nextOccurrence = new Date(today.getFullYear() + 1, month - 1, day);
  }

  const diffMs = nextOccurrence.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatReminderTimeLabel(days: number): string {
  if (days === 30) return "za miesiąc";
  if (days === 14) return "za 2 tygodnie";
  if (days === 7) return "za tydzień";
  if (days === 1) return "już jutro";
  return `za ${days} dni`;
}