/**
 * বাংলাদেশ সময় (Asia/Dhaka, UTC+6) হেল্পার।
 * Vercel সার্ভার UTC-তে চলে; শুধু new Date() ব্যবহার করলে রাত ১২টা–ভোর ৬টায়
 * "আজকের ক্লাস", "চলতি মাস" ও বকেয়ার হিসাব আগের দিনের ধরে নিত।
 */
const DHAKA_TZ = "Asia/Dhaka";

const dhakaParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: DHAKA_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** একটি Date, যার getFullYear/getMonth/getDate/getDay ইত্যাদি ঢাকার দেয়ালঘড়ির মান দেয় */
export function dhakaNow(): Date {
  const parts = dhakaParts.formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return new Date(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
}

/** ISO টাইমস্ট্যাম্প বা YYYY-MM-DD থেকে ঢাকার তারিখ (YYYY-MM-DD) */
export function dhakaDateKey(input: string | Date): string {
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const d = typeof input === "string" ? new Date(input) : input;
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DHAKA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
