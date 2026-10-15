"use client";

import Link from "next/link";
import { ArrowLeft, Calculator, LineChart } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/workspace/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadDb, money, totals, type Mortgage } from "@/lib/mortgage-store";

export default function DashboardPage() {
  const [mortgages, setMortgages] = useState<Mortgage[]>([]);

  useEffect(() => setMortgages(loadDb().mortgages), []);

  const sumPay = mortgages.reduce((s, m) => s + totals(m).payment, 0);
  const sumLeft = mortgages.reduce((s, m) => s + totals(m).remaining, 0);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">לוח בקרה</h1>
        <p className="text-muted-foreground">מקירה כללית של המשכנתאות שלך</p>
      </div>
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardDescription className="text-primary-foreground/70">תשלום חודשי</CardDescription>
            <CardTitle className="text-3xl">{money(sumPay)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>יתרה כוללת</CardDescription>
            <CardTitle className="text-3xl">{money(sumLeft)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>משכנתאות פעילים</CardDescription>
            <CardTitle className="text-3xl">{mortgages.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <LineChart className="mb-2 size-5 text-muted-foreground" />
            <CardTitle>מפקח משכנתא</CardTitle>
            <CardDescription>עקוב אחר המשכנתא שלך, קבל ניתוח AI והמלצות לחיסכון</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/watch">
                כניסה למעקב
                <ArrowLeft />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <Calculator className="mb-2 size-5" />
            <CardTitle>יועץ תמהיל משכנתא</CardTitle>
            <CardDescription className="text-primary-foreground/70">קבל תמהיל משכנתא מותאם אישית באמצעות AI</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/plan">
                התחלת שאלון
                <ArrowLeft />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="mb-3 font-semibold">המשכנתאות שלי</h2>
          {mortgages.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">עדיין לא הוזנה משכנתא</CardContent>
            </Card>
          ) : (
            mortgages.map((m) => {
              const t = totals(m);
              return (
                <Link key={m.id} href={`/watch/${m.id}`}>
                  <Card className="mb-3 transition-colors hover:bg-accent">
                    <CardHeader>
                      <CardTitle className="text-base">{m.bank}</CardTitle>
                      <CardDescription>
                        {t.trackCount} מסלולים · {m.years} שנה
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
        <div>
          <h2 className="mb-3 font-semibold">כל המשכנתאות</h2>
          <Card>
            <CardHeader>
              <CardTitle>{money(sumLeft)}</CardTitle>
              <CardDescription>{money(sumPay)} / חודש</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
