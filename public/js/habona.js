const Habona = (() => {
  const MARKET = {
    asOf: "2026-10-15",
    boiRate: 4.5,
    prime: 6.0,
    annualCpi: 2.6,
    anchors: {
      variable_unlinked: { name: 'עוגן אג"ח לא צמוד', rate: 4.35 },
      variable_cpi: { name: 'עוגן אג"ח צמוד מדד', rate: 2.1 },
    },
  };

  function money(value) {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }).format(Math.round(value || 0));
  }

  function pct(value, digits = 2) {
    return `${Number(value || 0).toFixed(digits)}%`;
  }

  function addMonths(iso, months) {
    const date = new Date(iso);
    date.setMonth(date.getMonth() + months);
    return date.toISOString().slice(0, 10);
  }

  function monthlyPayment(principal, annualRate, monthsLeft) {
    if (principal <= 0 || monthsLeft <= 0) return 0;
    const r = annualRate / 100 / 12;
    if (r === 0) return principal / monthsLeft;
    return (principal * r * (1 + r) ** monthsLeft) / ((1 + r) ** monthsLeft - 1);
  }

  function currentRate(track, market) {
    if (track.kind === "prime") return market.prime + (track.spread || 0);
    if (track.kind === "variable_unlinked") return market.anchors.variable_unlinked.rate + (track.spread || 0);
    if (track.kind === "variable_cpi") return market.anchors.variable_cpi.rate + (track.spread || 0);
    return track.annualRate;
  }

  function shouldResetAnchor(track, onDate) {
    if (track.kind === "prime") return true;
    if (track.kind === "fixed_unlinked" || track.kind === "fixed_cpi") return false;
    if (!track.nextResetDate) return false;
    return onDate >= track.nextResetDate;
  }

  function stepMonth(track, market, onDate) {
    const next = { ...track };
    const monthsLeft = Math.max(1, next.monthsTotal - next.monthsElapsed);

    if (next.cpiLinked) {
      next.principal *= 1 + market.annualCpi / 100 / 12;
    }

    if (shouldResetAnchor(next, onDate)) {
      next.annualRate = currentRate(next, market);
      if (next.resetEveryMonths && next.kind !== "prime") {
        next.nextResetDate = addMonths(onDate, next.resetEveryMonths);
        next.lastResetDate = onDate;
      }
    }

    next.payment = monthlyPayment(next.principal, next.annualRate, monthsLeft);
    const monthlyRate = next.annualRate / 100 / 12;
    const interest = next.principal * monthlyRate;
    const principalPaid = Math.min(Math.max(next.payment - interest, 0), next.principal);
    next.principal = Math.max(0, next.principal - principalPaid);
    next.monthsElapsed += 1;
    next.lastInterest = interest;
    next.lastPrincipalPaid = principalPaid;
    next.asOf = onDate;
    return next;
  }

  function summarize(tracks) {
    const principal = tracks.reduce((sum, track) => sum + track.principal, 0);
    const payment = tracks.reduce((sum, track) => sum + (track.payment || monthlyPayment(track.principal, track.annualRate, track.monthsTotal - track.monthsElapsed)), 0);
    return { principal, payment, trackCount: tracks.length };
  }

  function demoReport(today = "2026-10-15") {
    return {
      bank: "בנק לאומי",
      reportDate: today,
      tracks: [
        {
          id: "kalatz",
          kind: "fixed_unlinked",
          name: 'קל"צ',
          principal: 420000,
          originalPrincipal: 480000,
          annualRate: 4.85,
          spread: 0,
          monthsTotal: 300,
          monthsElapsed: 48,
          resetEveryMonths: null,
          nextResetDate: null,
          cpiLinked: false,
          startDate: "2022-10-15",
        },
        {
          id: "prime",
          kind: "prime",
          name: "פריים",
          principal: 385000,
          originalPrincipal: 450000,
          annualRate: 6.4,
          spread: 0.4,
          monthsTotal: 300,
          monthsElapsed: 48,
          resetEveryMonths: 1,
          nextResetDate: today,
          cpiLinked: false,
          startDate: "2022-10-15",
        },
        {
          id: "var5",
          kind: "variable_unlinked",
          name: "משתנה לא צמודה כל 5 שנים",
          principal: 310000,
          originalPrincipal: 350000,
          annualRate: 5.25,
          spread: 0.9,
          monthsTotal: 300,
          monthsElapsed: 48,
          resetEveryMonths: 60,
          nextResetDate: "2027-10-15",
          cpiLinked: false,
          startDate: "2022-10-15",
        },
      ],
    };
  }

  function recommendMix(answers) {
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
    let variableYears = 5;

    if (risk === "stable") {
      kalatz = stableJob ? 55 : 50;
      prime = 25;
      variable = 20;
    } else if (risk === "low_now") {
      kalatz = 30;
      prime = 40;
      variable = 30;
      variableYears = stay <= 5 ? 5 : 5;
    }

    if (stay <= 6) {
      kalatz = Math.min(kalatz, 35);
      prime += 10;
      variable = 100 - kalatz - prime;
    }
    if (!cpiOk) {
      /* keep unlinked tracks only */
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

    const kalatzAmt = loan * kalatz / 100;
    const primeAmt = loan * prime / 100;
    const varAmt = loan * variable / 100;
    const kalatzRate = 4.75;
    const primeRate = MARKET.prime + 0.35;
    const varRate = MARKET.anchors.variable_unlinked.rate + 0.85;
    const months = years * 12;

    const tracks = [
      { name: 'קל"צ', kind: "fixed_unlinked", share: kalatz, amount: kalatzAmt, rate: kalatzRate, months, note: "ריבית קבועה לכל התקופה. יציבות מלאה." },
      { name: "פריים", kind: "prime", share: prime, amount: primeAmt, rate: primeRate, months, note: "מתעדכן כשריבית בנק ישראל משתנה." },
      { name: `משתנה כל ${variableYears} שנים`, kind: "variable_unlinked", share: variable, amount: varAmt, rate: varRate, months, resetEveryMonths: variableYears * 12, note: `העוגן מתעדכן רק אחת ל-${variableYears} שנים, לא כל חודש.` },
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
        cpiOk ? "הצמדה למדד אפשרית, אבל בתמהיל הנוכחי נשארנו במסלולים לא צמודים כדי לשמור על ודאות בקרן." : "ציינת שאתה מעדיף בלי מדד — כל המסלולים לא צמודים.",
      ],
    };
  }

  function requireAuth() {
    if (!sessionStorage.getItem("authPhone") && !sessionStorage.getItem("authEmail")) {
      window.location.href = "/login.html";
    }
  }

  function loadDb() {
    const raw = localStorage.getItem("habonaDb");
    if (raw) return JSON.parse(raw);
    return { mortgages: [] };
  }

  function saveDb(db) {
    localStorage.setItem("habonaDb", JSON.stringify(db));
  }

  function uid() {
    return "m" + Math.random().toString(36).slice(2, 9);
  }

  function numberFrom(text) {
    if (!text) return 0;
    const clean = String(text).replace(/[^\d.]/g, "");
    return Number(clean) || 0;
  }

  function detectBank(text) {
    if (/מזרחי|טפחות/.test(text)) return 'בנק מזרחי-טפחות בע"מ';
    if (/לאומי/.test(text)) return "בנק לאומי";
    if (/הפועלים/.test(text)) return "בנק הפועלים";
    if (/דיסקונט/.test(text)) return "בנק דיסקונט";
    if (/הבינלאומי/.test(text)) return "הבנק הבינלאומי";
    if (/ירושלים/.test(text)) return "בנק ירושלים";
    return "משכנתא";
  }

  function detectKind(text) {
    if (/פריים/.test(text)) return { kind: "prime", name: "פריים", cpi: false };
    if (/קל.?צ|קבועה לא צמודה/.test(text)) return { kind: "fixed_unlinked", name: 'קל"צ', cpi: false };
    if (/קבועה צמודה|קל.?צ צמוד/.test(text)) return { kind: "fixed_cpi", name: "קבועה צמודה למדד", cpi: true };
    if (/משתנה/.test(text) && /מדד|צמוד/.test(text)) return { kind: "variable_cpi", name: "משתנה צמודה למדד", cpi: true };
    if (/משתנה/.test(text)) return { kind: "variable_unlinked", name: "משתנה לא צמודה", cpi: false };
    return { kind: "variable_cpi", name: "מסלול", cpi: /מדד|צמוד/.test(text) };
  }

  function parseReportText(text) {
    const flat = text.replace(/\u00a0/g, " ");
    const bank = detectBank(flat);
    const dateMatch = flat.match(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})/);
    const yearMatch = flat.match(/(\d{1,2})\s*שנ/);
    const amounts = [...flat.matchAll(/(\d{1,3}(?:,\d{3})+|\d{4,})(?:\.\d+)?/g)]
      .map((m) => Number(m[1].replace(/,/g, "")))
      .filter((n) => n >= 1000 && n < 20000000);
    const rates = [...flat.matchAll(/(\d{1,2}(?:[.,]\d{1,3})?)\s*%/g)]
      .map((m) => Number(m[1].replace(",", ".")))
      .filter((n) => n > 0 && n < 20);
    const monthly = [...flat.matchAll(/(?:החזר|תשלום)[^\d]{0,12}(\d{1,3}(?:,\d{3})*)/g)]
      .map((m) => Number(m[1].replace(/,/g, "")));

    const blocks = flat.split(/\n+/);
    const tracks = [];
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
        principal: lineAmounts[1] != null ? lineAmounts[1] : (lineAmounts[0] || 0),
        payment: lineAmounts.find((n) => n < 20000) || 0,
        years,
        monthsTotal: years * 12,
        monthsElapsed: 0,
      });
    });

    const uniqueTracks = tracks.filter((track, index, list) =>
      index === list.findIndex((other) => other.name === track.name && other.annualRate === track.annualRate && other.originalPrincipal === track.originalPrincipal)
    );

    return {
      id: uid(),
      bank,
      startDate: dateMatch ? dateMatch[1].replace(/\//g, ".") : "",
      years: Number(yearMatch ? yearMatch[1] : (uniqueTracks[0] && uniqueTracks[0].years) || 30),
      raw: flat.slice(0, 4000),
      tracks: uniqueTracks,
      parsedMonthly: monthly[0] || uniqueTracks.reduce((s, t) => s + (t.payment || 0), 0),
      parsedAmounts: amounts.slice(0, 12),
      parsedRates: rates.slice(0, 12),
    };
  }

  async function extractPdfText(file) {
    if (!window.pdfjsLib) throw new Error("pdfjs");
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(" ") + "\n";
    }
    return text;
  }

  function totals(mortgage) {
    const remaining = mortgage.tracks.reduce((s, t) => s + Number(t.principal || 0), 0);
    const original = mortgage.tracks.reduce((s, t) => s + Number(t.originalPrincipal || t.principal || 0), 0);
    const payment = mortgage.tracks.reduce((s, t) => s + Number(t.payment || 0), 0);
    const paidRatio = original > 0 ? Math.min(100, Math.round(((original - remaining) / original) * 100)) : 0;
    return { remaining, original, payment, paidRatio, trackCount: mortgage.tracks.length };
  }

  return {
    MARKET,
    money,
    pct,
    monthlyPayment,
    stepMonth,
    summarize,
    demoReport,
    recommendMix,
    requireAuth,
    shouldResetAnchor,
    addMonths,
    loadDb,
    saveDb,
    uid,
    parseReportText,
    extractPdfText,
    totals,
    detectKind,
  };
})();

