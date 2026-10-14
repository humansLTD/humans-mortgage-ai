export type TrackId = "fixed" | "prime";

export type MortgageInput = {
  loanAmount: number;
  payoffYears: number;
  fixedRate: number;
  primeRate: number;
  /** Share of the loan placed on the prime track, from 0 to 100. */
  primeShare: number;
};

export type YearRow = {
  year: number;
  principal: number;
  interest: number;
  payment: number;
  balance: number;
};

export type TrackSummary = {
  id: TrackId;
  name: string;
  share: number;
  principal: number;
  annualRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPaid: number;
  color: string;
};

export type MortgageResult = {
  loanAmount: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPaid: number;
  blendedRate: number;
  tracks: TrackSummary[];
  yearly: YearRow[];
  months: number;
  payoffYears: number;
};

const TRACK_META: Record<TrackId, { name: string; color: string }> = {
  fixed: { name: "Fixed", color: "#1e6b52" },
  prime: { name: "Prime", color: "#3d6f9a" },
};

export function calculateMortgage(input: MortgageInput): MortgageResult {
  const loanAmount = clamp(finite(input.loanAmount), 0, 50_000_000);
  const payoffYears = clamp(Math.round(finite(input.payoffYears)), 1, 40);
  const fixedRate = clamp(finite(input.fixedRate), 0, 25);
  const primeRate = clamp(finite(input.primeRate), 0, 25);
  const primeShare = clamp(finite(input.primeShare), 0, 100);
  const fixedShare = 100 - primeShare;
  const months = payoffYears * 12;

  const specs: Array<{ id: TrackId; share: number; rate: number }> = [
    { id: "fixed", share: fixedShare, rate: fixedRate },
    { id: "prime", share: primeShare, rate: primeRate },
  ];

  const schedules = specs.map((track) => {
    const principal = (loanAmount * track.share) / 100;
    return {
      ...track,
      principal,
      schedule: amortize(principal, track.rate, months),
    };
  });

  const tracks: TrackSummary[] = schedules.map((track) => {
    const totalInterest = sum(track.schedule, (month) => month.interest);
    const totalPaid = sum(track.schedule, (month) => month.payment);
    return {
      id: track.id,
      name: TRACK_META[track.id].name,
      color: TRACK_META[track.id].color,
      share: track.share,
      principal: track.principal,
      annualRate: track.rate,
      monthlyPayment: track.schedule[0]?.payment ?? 0,
      totalInterest,
      totalPaid,
    };
  });

  const yearly: YearRow[] = [];
  if (loanAmount > 0) {
    for (let year = 1; year <= payoffYears; year += 1) {
      let principalPaid = 0;
      let interestPaid = 0;
      let payment = 0;
      let balance = 0;
      const start = (year - 1) * 12;

      for (const track of schedules) {
        const slice = track.schedule.slice(start, start + 12);
        for (const month of slice) {
          principalPaid += month.principal;
          interestPaid += month.interest;
          payment += month.payment;
        }
        const end = track.schedule[Math.min(year * 12, track.schedule.length) - 1];
        balance += end?.balance ?? 0;
      }

      yearly.push({
        year,
        principal: principalPaid,
        interest: interestPaid,
        payment,
        balance,
      });
    }
  }

  const totalInterest = sum(tracks, (track) => track.totalInterest);
  const totalPaid = sum(tracks, (track) => track.totalPaid);
  const monthlyPayment = sum(tracks, (track) => track.monthlyPayment);
  const blendedRate =
    loanAmount > 0
      ? tracks.reduce((total, track) => total + track.annualRate * track.principal, 0) / loanAmount
      : 0;

  return {
    loanAmount,
    monthlyPayment,
    totalInterest,
    totalPaid,
    blendedRate,
    tracks,
    yearly,
    months,
    payoffYears,
  };
}

type MonthRow = {
  principal: number;
  interest: number;
  payment: number;
  balance: number;
};

function amortize(principal: number, annualRate: number, months: number): MonthRow[] {
  if (principal <= 0 || months <= 0) return [];

  const monthlyRate = annualRate / 100 / 12;
  const due =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * (1 + monthlyRate) ** months) /
        ((1 + monthlyRate) ** months - 1);

  const rows: MonthRow[] = [];
  let balance = principal;

  for (let month = 0; month < months; month += 1) {
    const interest = balance * monthlyRate;
    const principalPaid = Math.min(Math.max(due - interest, 0), balance);
    balance = Math.max(0, balance - principalPaid);
    rows.push({
      principal: principalPaid,
      interest,
      payment: principalPaid + interest,
      balance,
    });
  }

  return rows;
}

function finite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sum<T>(items: T[], pick: (item: T) => number): number {
  return items.reduce((total, item) => total + pick(item), 0);
}
