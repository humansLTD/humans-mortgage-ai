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
  };
})();
