// lib/age.ts
export function formatAge(birthDate: Date | string | null | undefined): string | null {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;

  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();

  if (today.getDate() < birth.getDate()) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) return null;

  // Dla maluchów poniżej 1 roku pokazujemy miesiące
  if (years === 0) {
    return `${months} mies.`;
  }

  if (years === 1) return "1 rok";

  const lastDigit = years % 10;
  const lastTwoDigits = years % 100;

  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return `${years} lata`;
  }

  return `${years} lat`;
}