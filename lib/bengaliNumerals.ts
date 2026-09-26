// মূল ওয়েবসাইট রিপোর lib/bengaliNumerals.ts থেকে হুবহু কপি করা, যাতে অ্যাডমিন
// প্যানেলেও সংখ্যা ঠিক একই নিয়মে বাংলায় দেখানো যায়।

const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBengaliDigits(
  value: number,
  options: { grouped?: boolean } = {}
): string {
  const rounded = Math.round(value);
  const raw = options.grouped
    ? rounded.toLocaleString("en-US")
    : String(rounded);

  return raw.replace(/[0-9]/g, (d) => BENGALI_DIGITS[Number(d)]);
}

const BENGALI_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export function formatBengaliDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;

  const day = toBengaliDigits(d.getDate());
  const month = BENGALI_MONTHS[d.getMonth()];
  const year = toBengaliDigits(d.getFullYear());

  return `${day} ${month}, ${year}`;
}

export function formatBengaliMonthYear(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return `${BENGALI_MONTHS[d.getMonth()]} ${toBengaliDigits(d.getFullYear())}`;
}

export { BENGALI_MONTHS };
