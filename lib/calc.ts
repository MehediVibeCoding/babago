/**
 * নিরাপদ ক্যালকুলেটর: শুধু সংখ্যা ও + - * / ( ) নিয়ে কাজ করে — eval/Function ছাড়া।
 * ভুল ইনপুট বা শূন্য দিয়ে ভাগ হলে null ফেরত দেয়।
 */
export function safeCalculate(input: string): number | null {
  const s = input.replace(/\s+/g, "");
  if (!s || !/^[0-9+\-*/().]+$/.test(s)) return null;

  let pos = 0;
  const peek = () => s[pos];

  function parseExpression(): number | null {
    let left = parseTerm();
    if (left === null) return null;
    while (peek() === "+" || peek() === "-") {
      const op = s[pos++];
      const right = parseTerm();
      if (right === null) return null;
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number | null {
    let left = parseFactor();
    if (left === null) return null;
    while (peek() === "*" || peek() === "/") {
      const op = s[pos++];
      const right = parseFactor();
      if (right === null) return null;
      if (op === "/" && right === 0) return null;
      left = op === "*" ? left * right : left / right;
    }
    return left;
  }

  function parseFactor(): number | null {
    if (peek() === "-") {
      pos++;
      const v = parseFactor();
      return v === null ? null : -v;
    }
    if (peek() === "(") {
      pos++;
      const v = parseExpression();
      if (v === null || peek() !== ")") return null;
      pos++;
      return v;
    }
    const start = pos;
    while (pos < s.length && /[0-9.]/.test(s[pos])) pos++;
    if (start === pos) return null;
    const n = Number(s.slice(start, pos));
    return Number.isFinite(n) ? n : null;
  }

  const result = parseExpression();
  if (result === null || pos !== s.length || !Number.isFinite(result)) return null;
  return result;
}
