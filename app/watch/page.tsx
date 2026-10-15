"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/workspace/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  detectKind,
  loadDb,
  money,
  parseReportText,
  saveDb,
  totals,
  uid,
  type Mortgage,
  type Track,
} from "@/lib/mortgage-store";
import { extractPdfText } from "@/lib/pdf-text";

export default function WatchPage() {
  const [mortgages, setMortgages] = useState<Mortgage[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState<Omit<Mortgage, "id"> | null>(null);

  useEffect(() => setMortgages(loadDb().mortgages), []);

  async function onFile(file: File) {
    setStatus("קורא את הדוח...");
    try {
      let text = file.name;
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        text = await extractPdfText(file);
      }
      const parsed = parseReportText(text);
      if (!parsed.tracks.length) {
        parsed.tracks = [{ id: uid(), name: "מסלול 1", kind: "variable_cpi", annualRate: 0, originalPrincipal: 0, principal: 0, payment: 0, years: 15 }];
        setStatus("לא זוהו מסלולים אוטומטית. מלאו לפי הדוח.");
      } else {
        setStatus(`חולצו ${parsed.tracks.length} מסלולים מתוך ${file.name}. אשרו לפני שמירה.`);
      }
      setDraft(parsed);
    } catch {
      setStatus("לא הצלחנו לקרוא את הקובץ. מלאו ידנית.");
      setDraft({ bank: "", startDate: "", years: 30, tracks: [{ id: uid(), name: "מסלול 1", kind: "variable_cpi", annualRate: 0, originalPrincipal: 0, principal: 0, payment: 0, years: 15 }] });
    }
  }

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const tracks: Track[] = [];
    for (let i = 0; i < 8; i += 1) {
      const name = String(data.get("t_name_" + i) || "");
      if (!name) continue;
      const meta = detectKind(name);
      tracks.push({
        id: uid(),
        name,
        kind: meta.kind,
        cpiLinked: meta.cpi,
        annualRate: Number(data.get("t_rate_" + i) || 0),
        originalPrincipal: Number(data.get("t_orig_" + i) || 0),
        principal: Number(data.get("t_left_" + i) || 0),
        payment: Number(data.get("t_pay_" + i) || 0),
        years: Number(data.get("t_years_" + i) || 15),
      });
    }
    const next = {
      mortgages: [
        ...loadDb().mortgages,
        { id: uid(), bank: String(data.get("bank") || ""), startDate: String(data.get("startDate") || ""), years: Number(data.get("years") || 30), tracks },
      ],
    };
    saveDb(next);
    setMortgages(next.mortgages);
    setOpen(false);
    setDraft(null);
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">מפקח משכנתא</h1>
          <p className="text-muted-foreground">עקוב אחר המשכנתא שלך וקבל ניתוח AI</p>
        </div>
        <Button onClick={() => setOpen((v) => !v)}>
          <Plus />
          הוספת משכנתא
        </Button>
      </div>

      {open && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>העלאת דוח יתרות</CardTitle>
            <CardDescription>PDF מהבנק. נחלץ טקסט ונציג לאישור לפני שמירה.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" accept=".pdf,image/*" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            {status && <p className="text-sm text-muted-foreground">{status}</p>}
            {draft && (
              <form className="space-y-4" onSubmit={save}>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>בנק</Label>
                    <Input name="bank" defaultValue={draft.bank} />
                  </div>
                  <div className="space-y-2">
                    <Label>תאריך התחלה</Label>
                    <Input name="startDate" defaultValue={draft.startDate} />
                  </div>
                  <div className="space-y-2">
                    <Label>שנים</Label>
                    <Input name="years" type="number" defaultValue={draft.years} />
                  </div>
                </div>
                {draft.tracks.map((track, i) => (
                  <Card key={track.id}>
                    <CardContent className="grid gap-3 pt-6 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>מסלול</Label>
                        <Input name={`t_name_${i}`} defaultValue={track.name} />
                      </div>
                      <div className="space-y-2">
                        <Label>ריבית %</Label>
                        <Input name={`t_rate_${i}`} type="number" step="0.01" defaultValue={track.annualRate} />
                      </div>
                      <div className="space-y-2">
                        <Label>שנים</Label>
                        <Input name={`t_years_${i}`} type="number" defaultValue={track.years} />
                      </div>
                      <div className="space-y-2">
                        <Label>סכום מקורי</Label>
                        <Input name={`t_orig_${i}`} type="number" defaultValue={track.originalPrincipal} />
                      </div>
                      <div className="space-y-2">
                        <Label>יתרה</Label>
                        <Input name={`t_left_${i}`} type="number" defaultValue={track.principal} />
                      </div>
                      <div className="space-y-2">
                        <Label>החזר חודשי</Label>
                        <Input name={`t_pay_${i}`} type="number" defaultValue={track.payment} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button type="submit">שמירת משכנתא</Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {mortgages.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">אין עדיין משכנתאות. הוסיפו דוח יתרות.</CardContent>
          </Card>
        )}
        {mortgages.map((m) => {
          const t = totals(m);
          return (
            <Link key={m.id} href={`/watch/${m.id}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{m.bank}</CardTitle>
                    <CardDescription>
                      {m.startDate} · {t.trackCount} מסלולים
                    </CardDescription>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-muted-foreground">יתרה</div>
                    <div className="text-xl font-semibold">{money(t.remaining)}</div>
                    <div className="text-sm text-muted-foreground">תשלום {money(t.payment)}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={t.paidRatio} dir="ltr" />
                  <p className="mt-2 text-xs text-muted-foreground">הוחזר עד כה {t.paidRatio}%</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
