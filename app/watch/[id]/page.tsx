"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/workspace/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadDb, money, pct, saveDb, totals, type Mortgage } from "@/lib/mortgage-store";

const COLORS = ["#1d4f73", "#7ea0b8", "#c7b29a", "#4b7a9a"];

export default function MortgageDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [mortgage, setMortgage] = useState<Mortgage | null>(null);

  useEffect(() => {
    const found = loadDb().mortgages.find((item) => item.id === params.id) || null;
    setMortgage(found);
  }, [params.id]);

  const t = mortgage ? totals(mortgage) : null;
  const pieData = useMemo(
    () =>
      (mortgage?.tracks || []).map((track) => ({
        name: track.name,
        value: Number(track.originalPrincipal || track.principal || 0),
      })),
    [mortgage],
  );
  const lineData = useMemo(() => {
    if (!mortgage || !t) return [];
    const startYear = Number(String(mortgage.startDate || "2011").match(/\d{4}/)) || 2011;
    const years = Number(mortgage.years || 30);
    const rows = [];
    for (let y = startYear; y <= startYear + years; y += 1) {
      const progress = (y - startYear) / Math.max(1, years);
      rows.push({ year: String(y), remaining: Math.max(0, t.original * (1 - progress)) });
    }
    return rows;
  }, [mortgage, t]);

  function deleteTrack(trackId: string) {
    if (!mortgage) return;
    const db = loadDb();
    const next = db.mortgages.map((item) =>
      item.id === mortgage.id ? { ...item, tracks: item.tracks.filter((track) => track.id !== trackId) } : item,
    );
    saveDb({ mortgages: next });
    const updated = next.find((item) => item.id === mortgage.id) || null;
    setMortgage(updated);
    if (updated && updated.tracks.length === 0) router.push("/watch");
  }

  if (!mortgage || !t) {
    return (
      <AppShell>
        <Card>
          <CardHeader>
            <CardTitle>המשכנתא לא נמצאה</CardTitle>
            <CardDescription>חזרו לרשימת המעקב ובחרו משכנתא קיימת.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/watch">חזרה למפקח</Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{mortgage.bank}</h1>
          <p className="text-muted-foreground">
            התחיל ב-{mortgage.startDate || "—"} · {mortgage.years || ""} שנה
          </p>
        </div>
        <Button asChild>
          <Link href="/watch">הוספת מסלול</Link>
        </Button>
      </div>
      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>סכום מקורי</CardDescription>
            <CardTitle className="text-2xl">{money(t.original)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>יתרה נוכחית</CardDescription>
            <CardTitle className="text-2xl">{money(t.remaining)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>החזר חודשי</CardDescription>
            <CardTitle className="text-2xl">{money(t.payment)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardDescription className="text-primary-foreground/70">מסלולים</CardDescription>
            <CardTitle className="text-2xl">{t.trackCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>פילוח מסלולים</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => money(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>יתרת המשכנתא לאורך זמן</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(value: number) => money(value)} />
                <Line type="monotone" dataKey="remaining" stroke="#163a56" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <h2 className="mb-3 font-semibold">מסלולי המשכנתא</h2>
      <div className="space-y-3">
        {mortgage.tracks.map((track, i) => (
          <Card key={track.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="size-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {track.name}
                </CardTitle>
                <CardDescription>
                  ריבית {pct(track.annualRate)} · {track.years || ""} שנה
                </CardDescription>
              </div>
              <Button variant="destructive" size="sm" onClick={() => deleteTrack(track.id)}>
                מחיקה
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">סכום מקורי</div>
                <div className="font-semibold">{money(track.originalPrincipal || 0)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">יתרה</div>
                <div className="font-semibold">{money(track.principal || 0)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">תשלום חודשי</div>
                <div className="font-semibold">{money(track.payment || 0)}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        {mortgage.tracks.map((track, i) => (
          <Badge key={track.id} variant="secondary">
            <span className="ml-1 size-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {track.name}
          </Badge>
        ))}
      </div>
    </AppShell>
  );
}
