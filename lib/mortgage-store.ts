export type Track = {
  id: string;
  name: string;
  kind: string;
  cpiLinked?: boolean;
  annualRate: number;
  originalPrincipal: number;
  principal: number;
  payment: number;
  years: number;
};

export type Mortgage = {
  id: string;
  bank: string;
  startDate: string;
  years: number;
  tracks: Track[];
};

const KEY = "habonaDb";

export function uid() {
  return "m" + Math.random().toString(36).slice(2, 9);
}

export function loadDb(): { mortgages: Mortgage[] } {
  if (typeof window === "undefined") return { mortgages: [] };
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : { mortgages: [] };
}

export function saveDb(db: { mortgages: Mortgage[] }) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function totals(mortgage: Mortgage) {
  const remaining = mortgage.tracks.reduce((s, t) => s + Number(t.principal || 0), 0);
  const original = mortgage.tracks.reduce((s, t) => s + Number(t.originalPrincipal || t.principal || 0), 0);
  const payment = mortgage.tracks.reduce((s, t) => s + Number(t.payment || 0), 0);
  const paidRatio = original > 0 ? Math.min(100, Math.round(((original - remaining) / original) * 100)) : 0;
  return { remaining, original, payment, paidRatio, trackCount: mortgage.tracks.length };
}

export function money(value: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(
    Math.round(value || 0),
  );
}

export function pct(value: number, digits = 2) {
  return `${Number(value || 0).toFixed(digits)}%`;
}

export const MARKET = {
  asOf: "2026-10-15",
  boiRate: 4.5,
  prime: 6.0,
  annualCpi: 2.6,
  anchors: {
    variable_unlinked: { name: 'עוגן אג"ח לא צמוד', rate: 4.35 },
    variable_cpi: { name: 'עוגן אג"ח צמוד מדד', rate: 2.1 },
  },
};

export function monthlyPayment(principal: number, annualRate: number, monthsLeft: number) {
  if (principal <= 0 || monthsLeft <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / monthsLeft;
  return (principal * r * (1 + r) ** monthsLeft) / ((1 + r) ** monthsLeft - 1);
}

export function recommendMix(answers: Record<string, string>) {
  const value = Number(answers.propertyValue) || 0;
  const equity = Number(answers.equity) || 0;
  const loan = Math.max(value - equity, 0);
  const years = Number(answers.years) || 25;
  const income = Number(answers.income) || 0;
  const stay = Number(answers.stayYears) || 10;
  const risk = answers.preference || "balance";
  const cpiOk = answers.cpi === "yes";
  const stableJob = answers.job === "employee";

  let kalatz = 40;
  let prime = 30;
  let variable = 30;
  const variableYears = 5;

  if (risk === "stable") {
    kalatz = stableJob ? 55 : 50;
    prime = 25;
    variable = 20;
  } else if (risk === "low_now") {
    kalatz = 30;
    prime = 40;
    variable = 30;
  }

  if (stay <= 6) {
    kalatz = Math.min(kalatz, 35);
    prime += 10;
    variable = 100 - kalatz - prime;
  }

  const variablePlusPrime = prime + variable;
  if (variablePlusPrime > 66) {
    const extra = variablePlusPrime - 66;
    variable = Math.max(10, variable - extra);
    kalatz = 100 - prime - variable;
  }
  if (kalatz < 34) {
    const need = 34 - kalatz;
    kalatz = 34;
    variable = Math.max(0, variable - need);
  }

  const months = years * 12;
  const tracks = [
    {
      name: 'קל"צ',
      kind: "fixed_unlinked",
      share: kalatz,
      amount: (loan * kalatz) / 100,
      rate: 4.75,
      months,
      note: "ריבית קבועה לכל התקופה. יציבות מלאה.",
    },
    {
      name: "פריים",
      kind: "prime",
      share: prime,
      amount: (loan * prime) / 100,
      rate: MARKET.prime + 0.35,
      months,
      note: "מתעדכן כשריבית בנק ישראל משתנה.",
    },
    {
      name: `משתנה כל ${variableYears} שנים`,
      kind: "variable_unlinked",
      share: variable,
      amount: (loan * variable) / 100,
      rate: MARKET.anchors.variable_unlinked.rate + 0.85,
      months,
      note: `העוגן מתעדכן רק אחת ל-${variableYears} שנים, לא כל חודש.`,
    },
  ];
  const payment = tracks.reduce((sum, track) => sum + monthlyPayment(track.amount, track.rate, track.months), 0);
  const pti = income > 0 ? (payment / income) * 100 : 0;
  return {
    loan,
    years,
    payment,
    pti,
    tracks,
    reasons: [
      risk === "stable" ? "ביקשת יציבות — יותר קל\"צ." : risk === "low_now" ? "ביקשת החזר נמוך עכשיו — יותר פריים." : "תמהיל מאוזן בין יציבות לגמישות.",
      "לפי הנחיות בנק ישראל: לפחות כשליש בריבית קבועה, ולא יותר משני שלישים במסלולים משתנים (כולל פריים).",
      stay <= 6 ? "תקופת מגורים קצרה יחסית — פחות נעילה ארוכה בקל\"צ." : "אופק מגורים ארוך — כדאי רכיב קבוע משמעותי.",
      cpiOk
        ? "הצמדה למדד אפשרית, אבל בתמהיל הנוכחי נשארנו במסלולים לא צמודים כדי לשמור על ודאות בקרן."
        : "ציינת שאתה מעדיף בלי מדד — כל המסלולים לא צמודים.",
    ],
  };
}

export function detectBank(text: string) {
  if (/מזרחי|טפחות/.test(text)) return 'בנק מזרחי-טפחות בע"מ';
  if (/לאומי/.test(text)) return "בנק לאומי";
  if (/הפועלים/.test(text)) return "בנק הפועלים";
  if (/דיסקונט/.test(text)) return "בנק דיסקונט";
  if (/הבינלאומי/.test(text)) return "הבנק הבינלאומי";
  return "משכנתא";
}

export function detectKind(text: string) {
  if (/פריים/.test(text)) return { kind: "prime", name: "פריים", cpi: false };
  if (/קל.?צ|קבועה לא צמודה/.test(text)) return { kind: "fixed_unlinked", name: 'קל"צ', cpi: false };
  if (/משתנה/.test(text) && /מדד|צמוד/.test(text)) return { kind: "variable_cpi", name: "משתנה צמודה למדד", cpi: true };
  if (/משתנה/.test(text)) return { kind: "variable_unlinked", name: "משתנה לא צמודה", cpi: false };
  return { kind: "variable_cpi", name: "מסלול", cpi: /מדד|צמוד/.test(text) };
}

export function parseReportText(text: string): Omit<Mortgage, "id"> & { tracks: Track[] } {
  const flat = text.replace(/\u00a0/g, " ");
  const dateMatch = flat.match(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})/);
  const yearMatch = flat.match(/(\d{1,2})\s*שנ/);
  const rates = [...flat.matchAll(/(\d{1,2}(?:[.,]\d{1,3})?)\s*%/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => n > 0 && n < 20);
  const blocks = flat.split(/\n+/);
  const tracks: Track[] = [];
  blocks.forEach((line, i) => {
    if (!/משתנה|פריים|קל.?צ|קבועה|צמוד|מדד/.test(line)) return;
    const windowText = blocks.slice(Math.max(0, i - 2), i + 4).join(" ");
    const meta = detectKind(line + " " + windowText);
    const lineRates = [...windowText.matchAll(/(\d{1,2}(?:[.,]\d{1,3})?)\s*%/g)].map((m) => Number(m[1].replace(",", ".")));
    const lineAmounts = [...windowText.matchAll(/(\d{1,3}(?:,\d{3})+)/g)].map((m) => Number(m[1].replace(/,/g, "")));
    const years = Number((windowText.match(/(\d{1,2})\s*שנ/) || [])[1]) || 15;
    if (!lineAmounts.length && !lineRates.length) return;
    tracks.push({
      id: uid(),
      name: meta.name,
      kind: meta.kind,
      cpiLinked: meta.cpi,
      annualRate: lineRates[0] || rates[tracks.length] || 0,
      originalPrincipal: lineAmounts[0] || 0,
      principal: lineAmounts[1] != null ? lineAmounts[1] : lineAmounts[0] || 0,
      payment: lineAmounts.find((n) => n < 20000) || 0,
      years,
    });
  });
  return {
    bank: detectBank(flat),
    startDate: dateMatch ? dateMatch[1].replace(/\//g, ".") : "",
    years: Number(yearMatch ? yearMatch[1] : tracks[0]?.years || 30),
    tracks: tracks.filter(
      (track, index, list) =>
        index ===
        list.findIndex(
          (other) =>
            other.name === track.name &&
            other.annualRate === track.annualRate &&
            other.originalPrincipal === track.originalPrincipal,
        ),
    ),
  };
}
