"use client";

import { AppShell } from "@/components/workspace/app-shell";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MARKET, pct } from "@/lib/mortgage-store";

export default function MetricsPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">מדדים</h1>
        <p className="text-muted-foreground">מצב שוק לדוגמה, לתזמון עדכון עוגנים · נכון ל-{MARKET.asOf}</p>
      </div>
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardDescription className="text-primary-foreground/70">פריים</CardDescription>
            <CardTitle className="text-3xl">{pct(MARKET.prime)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>ריבית בנק ישראל</CardDescription>
            <CardTitle className="text-3xl">{pct(MARKET.boiRate)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{MARKET.anchors.variable_unlinked.name}</CardDescription>
            <CardTitle className="text-3xl">{pct(MARKET.anchors.variable_unlinked.rate)}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>איך העדכון עובד</CardTitle>
          <CardDescription>
            פריים מתעדכן כשבנק ישראל משנה ריבית. מסלול משתנה מתעדכן רק ביום העוגן החוזי.
          </CardDescription>
        </CardHeader>
      </Card>
    </AppShell>
  );
}
