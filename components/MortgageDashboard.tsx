"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactILS, formatILS, formatPercent, formatShare } from "@/lib/format";
import { calculateMortgage, type YearRow } from "@/lib/mortgage";

const LOAN_PRESETS = [800_000, 1_200_000, 1_800_000, 2_500_000];
const YEAR_PRESETS = [15, 20, 25, 30];
const PRINCIPAL_COLOR = "#1e6b52";
const INTEREST_COLOR = "#c4622d";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type ChartTipPayload = {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
};

export function MortgageDashboard() {
  const [loanAmount, setLoanAmount] = useState(1_500_000);
  const [primeShare, setPrimeShare] = useState(40);
  const [fixedRate, setFixedRate] = useState(4.85);
  const [primeRate, setPrimeRate] = useState(6);
  const [payoffYears, setPayoffYears] = useState(25);
  const [payoffLabel, setPayoffLabel] = useState("");

  const result = useMemo(
    () =>
      calculateMortgage({
        loanAmount,
        payoffYears,
        fixedRate,
        primeRate,
        primeShare,
      }),
    [loanAmount, payoffYears, fixedRate, primeRate, primeShare],
  );

  useEffect(() => {
    const payoff = new Date();
    payoff.setMonth(payoff.getMonth() + result.months);
    setPayoffLabel(`${MONTHS[payoff.getMonth()]} ${payoff.getFullYear()}`);
  }, [result.months]);

  const fixedShare = 100 - primeShare;
  const fixedTrack = result.tracks[0];
  const primeTrack = result.tracks[1];
  const yearFill = `${((payoffYears - 5) / 30) * 100}%`;
  const interestPerShekel = result.loanAmount > 0 ? result.totalInterest / result.loanAmount : 0;
  const firstYear = result.yearly[0];

  const balanceSeries = useMemo(() => {
    if (result.loanAmount <= 0) return [];
    return [
      { year: 0, balance: result.loanAmount },
      ...result.yearly.map((row) => ({ year: row.year, balance: row.balance })),
    ];
  }, [result]);

  const composition = [
    { name: "Principal", value: result.loanAmount, fill: PRINCIPAL_COLOR },
    { name: "Interest", value: result.totalInterest, fill: INTEREST_COLOR },
  ].filter((slice) => slice.value > 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(30,107,82,0.09),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(196,98,45,0.1),transparent_30%)]">
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(320px,390px)_minmax(0,1fr)] lg:px-8 lg:py-10">
        <header className="flex flex-wrap items-end justify-between gap-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-moss font-serif text-xl text-card">
              H
            </span>
            <div>
              <p className="font-serif text-3xl leading-none tracking-tight">Habona</p>
              <p className="mt-1 text-sm text-muted">Mortgage calculator</p>
            </div>
          </div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-sm text-muted">
            <span className="h-2 w-2 rounded-full bg-moss" aria-hidden />
            Live estimate
          </p>
        </header>

        <section className="h-fit rounded-[28px] border border-line bg-card p-5 shadow-[0_24px_50px_-36px_rgba(26,24,20,0.45)] lg:sticky lg:top-6">
          <h1 className="font-serif text-[1.7rem] leading-tight tracking-tight">
            Price the loan before you split it.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Set the amount, track split, rates, and term. The charts update with every change.
          </p>

          <div className="mt-6 space-y-6">
            <Field label="Loan amount" hint="Total principal to finance">
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted">₪</span>
                <input
                  aria-label="Loan amount"
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-line bg-paper py-3 pr-4 pl-9 text-lg font-medium tabular-nums outline-none"
                  value={loanAmount ? loanAmount.toLocaleString("en-US") : ""}
                  onChange={(event) => {
                    const next = Number(event.target.value.replace(/[^\d]/g, ""));
                    setLoanAmount(Number.isFinite(next) ? Math.min(next, 50_000_000) : 0);
                  }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {LOAN_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setLoanAmount(preset)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      loanAmount === preset ? "bg-ink text-card" : "bg-sand text-ink"
                    }`}
                  >
                    {formatCompactILS(preset)}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Track split" hint="Drag to divide the loan between fixed and prime">
              <div className="mb-3 grid grid-cols-2 gap-3">
                <ShareReadout
                  name="Fixed"
                  color="bg-moss"
                  share={fixedShare}
                  amount={fixedTrack.principal}
                  onShare={(share) => setPrimeShare(100 - share)}
                />
                <ShareReadout
                  name="Prime"
                  color="bg-prime"
                  share={primeShare}
                  amount={primeTrack.principal}
                  onShare={setPrimeShare}
                />
              </div>
              <input
                className="split-range"
                type="range"
                min={0}
                max={100}
                step={1}
                value={primeShare}
                aria-label="Prime track share"
                aria-valuetext={`${formatShare(primeShare)} prime, ${formatShare(fixedShare)} fixed`}
                style={{
                  background: `linear-gradient(to right, #1e6b52 0%, #1e6b52 ${fixedShare}%, #3d6f9a ${fixedShare}%, #3d6f9a 100%)`,
                }}
                onChange={(event) => setPrimeShare(Number(event.target.value))}
              />
            </Field>

            <Field label="Interest rate" hint="Annual rate for each track">
              <div className="grid grid-cols-2 gap-3">
                <RateInput
                  label="Fixed rate"
                  value={fixedRate}
                  accent="text-moss"
                  onChange={setFixedRate}
                />
                <RateInput
                  label="Prime rate"
                  value={primeRate}
                  accent="text-prime"
                  onChange={setPrimeRate}
                />
              </div>
            </Field>

            <Field label="Payoff years" hint={`${result.months.toLocaleString("en-US")} monthly payments`}>
              <div className="mb-3 flex items-end justify-between gap-3">
                <p className="font-serif text-4xl leading-none tabular-nums">{payoffYears}</p>
                <div className="flex gap-2">
                  {YEAR_PRESETS.map((years) => (
                    <button
                      key={years}
                      type="button"
                      onClick={() => setPayoffYears(years)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        payoffYears === years ? "bg-ink text-card" : "bg-sand text-ink"
                      }`}
                    >
                      {years}
                    </button>
                  ))}
                </div>
              </div>
              <input
                className="years-range"
                type="range"
                min={5}
                max={35}
                step={1}
                value={payoffYears}
                aria-label="Payoff years"
                aria-valuetext={`${payoffYears} years`}
                style={{ ["--fill" as string]: yearFill }}
                onChange={(event) => setPayoffYears(Number(event.target.value))}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-[28px] border border-line bg-moss-deep px-6 py-6 text-card shadow-[0_24px_50px_-36px_rgba(20,63,50,0.8)]">
            <p className="text-xs font-medium tracking-[0.16em] text-card/70 uppercase">Monthly payment</p>
            <p className="mt-2 font-serif text-5xl tracking-tight tabular-nums sm:text-6xl" aria-live="polite">
              {formatILS(result.monthlyPayment)}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-card/80">
              {result.loanAmount > 0 && firstYear
                ? `Year 1 sends ${formatILS(firstYear.interest)} to interest and ${formatILS(firstYear.principal)} to principal. Blended rate ${formatPercent(result.blendedRate)}.`
                : "Enter a loan amount to calculate the monthly payment."}
            </p>
            <dl className="mt-6 grid gap-3 sm:grid-cols-3">
              <HeroStat label="Total interest" value={formatILS(result.totalInterest)} />
              <HeroStat label="Total repayment" value={formatILS(result.totalPaid)} />
              <HeroStat label="Paid off" value={payoffLabel || `${payoffYears} years`} />
            </dl>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="Where the money goes" subtitle="Principal versus total interest">
              {composition.length === 0 ? (
                <EmptyChart />
              ) : (
                <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_140px]">
                  <div className="relative h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={composition}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={58}
                          outerRadius={84}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {composition.map((slice) => (
                            <Cell key={slice.name} fill={slice.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<MoneyTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 grid place-items-center">
                      <div className="text-center">
                        <p className="text-[11px] tracking-wide text-muted uppercase">Repayment</p>
                        <p className="font-serif text-lg tabular-nums">{formatCompactILS(result.totalPaid)}</p>
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-3 text-sm">
                    {composition.map((slice) => (
                      <li key={slice.name}>
                        <p className="flex items-center gap-2 text-muted">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.fill }} />
                          {slice.name}
                        </p>
                        <p className="mt-0.5 font-medium tabular-nums">{formatILS(slice.value)}</p>
                      </li>
                    ))}
                    <li className="border-t border-line pt-3 text-muted">
                      {formatILS(interestPerShekel)} interest per ₪1 borrowed
                    </li>
                  </ul>
                </div>
              )}
            </ChartCard>

            <ChartCard title="Track breakdown" subtitle="Monthly payment by track">
              <div className="space-y-5">
                {result.tracks.map((track) => {
                  const width = result.monthlyPayment > 0 ? (track.monthlyPayment / result.monthlyPayment) * 100 : 0;
                  return (
                    <div key={track.id}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                        <p className="font-medium">
                          {track.name}
                          <span className="ml-2 text-muted">{formatShare(track.share)}</span>
                        </p>
                        <p className="tabular-nums">{formatILS(track.monthlyPayment)}</p>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-sand">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${width}%`, background: track.color }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-muted">
                        {formatILS(track.principal)} at {formatPercent(track.annualRate)} · interest{" "}
                        {formatILS(track.totalInterest)}
                      </p>
                    </div>
                  );
                })}
                <div className="h-44">
                  {result.tracks.some((track) => track.principal > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={result.tracks.filter((track) => track.principal > 0)}
                          dataKey="principal"
                          nameKey="name"
                          innerRadius={46}
                          outerRadius={72}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {result.tracks
                            .filter((track) => track.principal > 0)
                            .map((track) => (
                              <Cell key={track.id} fill={track.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<MoneyTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart />
                  )}
                </div>
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Balance over time" subtitle="Remaining principal through the final payment">
            {balanceSeries.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceSeries} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e6b52" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#1e6b52" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e4dccf" vertical={false} />
                    <XAxis
                      dataKey="year"
                      tickFormatter={(year: number) => (year === 0 ? "Now" : String(year))}
                      tick={{ fill: "#746b60", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(value: number) => formatCompactILS(value)}
                      tick={{ fill: "#746b60", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={58}
                    />
                    <Tooltip content={<MoneyTooltip labelPrefix="Year" />} />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      name="Balance"
                      stroke="#1e6b52"
                      strokeWidth={2.5}
                      fill="url(#balanceFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Principal and interest by year" subtitle="How each year of payments is split">
            {result.yearly.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.yearly} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#e4dccf" vertical={false} />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: "#746b60", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      interval={payoffYears > 20 ? 4 : 2}
                    />
                    <YAxis
                      tickFormatter={(value: number) => formatCompactILS(value)}
                      tick={{ fill: "#746b60", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={58}
                    />
                    <Tooltip content={<MoneyTooltip labelPrefix="Year" />} />
                    <Bar dataKey="principal" name="Principal" stackId="year" fill={PRINCIPAL_COLOR} />
                    <Bar dataKey="interest" name="Interest" stackId="year" fill={INTEREST_COLOR} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <div className="overflow-hidden rounded-[28px] border border-line bg-card">
            <div className="flex items-end justify-between gap-3 px-5 py-4">
              <div>
                <h2 className="font-serif text-2xl tracking-tight">Yearly schedule</h2>
                <p className="text-sm text-muted">Combined across both tracks</p>
              </div>
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="sticky top-0 bg-sand text-xs tracking-wide text-muted uppercase">
                  <tr>
                    <th className="px-5 py-3 font-medium">Year</th>
                    <th className="px-3 py-3 font-medium">Payment</th>
                    <th className="px-3 py-3 font-medium">Principal</th>
                    <th className="px-3 py-3 font-medium">Interest</th>
                    <th className="px-5 py-3 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.yearly.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-muted">
                        The schedule appears once the loan amount is above zero.
                      </td>
                    </tr>
                  ) : (
                    result.yearly.map((row) => <ScheduleRow key={row.year} row={row} />)
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="px-1 text-xs leading-relaxed text-muted">
            Estimates use standard monthly amortization on each track, then add the payments together. They leave out
            fees, insurance, and CPI indexation, and a prime rate can change after origination.
          </p>
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-0.5 mb-2 text-xs text-muted">{hint}</p>
      {children}
    </div>
  );
}

function ShareReadout({
  name,
  color,
  share,
  amount,
  onShare,
}: {
  name: string;
  color: string;
  share: number;
  amount: number;
  onShare: (share: number) => void;
}) {
  return (
    <div className="rounded-2xl bg-paper px-3 py-2.5">
      <p className="flex items-center gap-2 text-xs text-muted">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        {name}
      </p>
      <div className="mt-1 flex items-baseline gap-1">
        <input
          aria-label={`${name} share percent`}
          inputMode="numeric"
          className="w-12 bg-transparent font-serif text-2xl tabular-nums outline-none"
          value={String(Math.round(share))}
          onChange={(event) => {
            const next = Number(event.target.value.replace(/[^\d]/g, ""));
            onShare(Number.isFinite(next) ? Math.min(next, 100) : 0);
          }}
        />
        <span className="text-sm text-muted">%</span>
      </div>
      <p className="text-xs tabular-nums text-muted">{formatILS(amount)}</p>
    </div>
  );
}

function RateInput({
  label,
  value,
  accent,
  onChange,
}: {
  label: string;
  value: number;
  accent: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-line px-3 py-2.5">
      <span className={`text-xs ${accent}`}>{label}</span>
      <div className="mt-1 flex items-baseline">
        <input
          aria-label={label}
          type="number"
          min={0}
          max={25}
          step={0.01}
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => {
            const next = event.target.value === "" ? 0 : Number(event.target.value);
            onChange(Number.isFinite(next) ? Math.min(Math.max(next, 0), 25) : 0);
          }}
          className="w-full bg-transparent text-lg font-medium tabular-nums outline-none"
        />
        <span className="text-sm text-muted">%</span>
      </div>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-3">
      <dt className="text-xs text-card/65">{label}</dt>
      <dd className="mt-1 text-lg font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-[28px] border border-line bg-card px-5 py-4">
      <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
      <p className="mb-3 text-sm text-muted">{subtitle}</p>
      {children}
    </article>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-44 place-items-center rounded-2xl bg-paper text-sm text-muted">
      Enter a loan amount to see this chart.
    </div>
  );
}

function ScheduleRow({ row }: { row: YearRow }) {
  return (
    <tr className="border-t border-line">
      <td className="px-5 py-2.5 tabular-nums">{row.year}</td>
      <td className="px-3 py-2.5 tabular-nums">{formatILS(row.payment)}</td>
      <td className="px-3 py-2.5 tabular-nums">{formatILS(row.principal)}</td>
      <td className="px-3 py-2.5 tabular-nums">{formatILS(row.interest)}</td>
      <td className="px-5 py-2.5 tabular-nums">{formatILS(row.balance)}</td>
    </tr>
  );
}

function MoneyTooltip({
  active,
  payload,
  label,
  labelPrefix,
}: {
  active?: boolean;
  payload?: ChartTipPayload[];
  label?: string | number;
  labelPrefix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2 text-sm shadow-sm">
      {label !== undefined ? (
        <p className="mb-1 text-xs text-muted">
          {labelPrefix ? `${labelPrefix} ${label}` : label}
        </p>
      ) : null}
      {payload.map((item) => (
        <p key={`${item.name}-${item.dataKey}`} className="flex items-center justify-between gap-4">
          <span className="text-muted">{item.name}</span>
          <span className="font-medium tabular-nums">{formatILS(Number(item.value ?? 0))}</span>
        </p>
      ))}
    </div>
  );
}
