"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/workspace/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { money, pct, recommendMix } from "@/lib/mortgage-store";

const steps = [
  [
    { id: "goal", label: "מה המטרה?", type: "select", options: [["first", "דירה ראשונה"], ["replace", "החלפת דירה"], ["refi", "מחזור משכנתא קיימת"], ["invest", "השקעה"]] },
    { id: "age", label: "גיל הלווה הראשי", type: "number" },
  ],
  [
    { id: "propertyValue", label: "שווי הנכס (₪)", type: "number" },
    { id: "equity", label: "הון עצמי (₪)", type: "number" },
  ],
  [
    { id: "years", label: "תקופת משכנתא מועדפת", type: "select", options: [["20", "20 שנה"], ["25", "25 שנה"], ["30", "30 שנה"]] },
    { id: "stayYears", label: "כמה שנים מתכננים לגור בנכס?", type: "number" },
  ],
  [
    { id: "income", label: "הכנסה נטו של משק הבית (₪ לחודש)", type: "number" },
    { id: "job", label: "יציבות הכנסה", type: "select", options: [["employee", "שכיר/ה קבוע"], ["self", "עצמאי/ת"], ["mixed", "מעורב"]] },
  ],
  [
    { id: "preference", label: "מה חשוב יותר?", type: "select", options: [["stable", "החזר יציב לאורך שנים"], ["balance", "איזון"], ["low_now", "החזר נמוך ככל האפשר עכשיו"]] },
    { id: "cpi", label: "מוכנים להצמדה למדד?", type: "select", options: [["no", "לא, בלי מדד"], ["yes", "כן, אם זה משתלם"]] },
  ],
] as const;

export default function PlanPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [mix, setMix] = useState<ReturnType<typeof recommendMix> | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = { ...answers };
    steps[step].forEach((field) => {
      next[field.id] = String(data.get(field.id) || "");
    });
    setAnswers(next);
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    setMix(recommendMix(next));
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">יועץ תמהיל משכנתא</h1>
        <p className="text-muted-foreground">שאלון קצר. התמהיל שומר על כללי בנק ישראל.</p>
      </div>
      {!mix ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>
              שאלה {step + 1} מתוך {steps.length}
            </CardTitle>
            <Progress value={((step + 1) / steps.length) * 100} dir="ltr" />
          </CardHeader>
          <CardContent>
            <form key={step} className="space-y-4" onSubmit={onSubmit}>
              {steps[step].map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>{field.label}</Label>
                  {field.type === "select" ? (
                    <Select id={field.id} name={field.id} defaultValue={answers[field.id]}>
                      {field.options.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input id={field.id} name={field.id} type="number" min={0} defaultValue={answers[field.id]} />
                  )}
                </div>
              ))}
              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                  חזרה
                </Button>
                <Button type="submit">{step === steps.length - 1 ? "חשב תמהיל" : "המשך"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardDescription className="text-primary-foreground/70">החזר חודשי</CardDescription>
                <CardTitle className="text-3xl">{money(mix.payment)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>סכום משכנתא</CardDescription>
                <CardTitle className="text-3xl">{money(mix.loan)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>יחס החזר</CardDescription>
                <CardTitle className="text-3xl">{mix.pti.toFixed(0)}%</CardTitle>
              </CardHeader>
            </Card>
          </div>
          {mix.tracks.map((track) => (
            <Card key={track.name}>
              <CardHeader>
                <CardTitle>
                  {track.name} · {track.share}%
                </CardTitle>
                <CardDescription>
                  {money(track.amount)} · {pct(track.rate)} · {track.note}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={track.share} dir="ltr" />
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardHeader>
              <CardTitle>למה התמהיל בנוי כך</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {mix.reasons.map((reason) => (
                <p key={reason}>{reason}</p>
              ))}
            </CardContent>
          </Card>
          <Button
            variant="outline"
            onClick={() => {
              setMix(null);
              setStep(0);
            }}
          >
            שאלון מחדש
          </Button>
        </div>
      )}
    </AppShell>
  );
}
