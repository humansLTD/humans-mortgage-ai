"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, FileSpreadsheet, LayoutDashboard, LogOut, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/watch", label: "מפקח משכנתא", icon: BarChart3 },
  { href: "/plan", label: "יועץ תמהיל", icon: FileSpreadsheet },
  { href: "/metrics", label: "מדדים", icon: PieChart },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!sessionStorage.getItem("authPhone") && !sessionStorage.getItem("authEmail")) {
      router.replace("/login.html");
      return;
    }
    setEmail(sessionStorage.getItem("authEmail") || sessionStorage.getItem("authPhone") || "");
  }, [router]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-5 text-lg font-bold">
          <span className="flex size-9 items-center justify-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground">
            <FileSpreadsheet className="size-4" />
          </span>
          משכנתא חכמה
        </Link>
        <nav className="grid gap-1 px-3">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            const Icon = link.icon;
            return (
              <Button
                key={link.href}
                asChild
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "justify-start",
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-white/10 hover:text-white",
                )}
              >
                <Link href={link.href}>
                  <Icon />
                  {link.label}
                </Link>
              </Button>
            );
          })}
        </nav>
        <div className="mt-auto px-4 py-4">
          <Separator className="mb-3 bg-white/15" />
          <p className="text-xs opacity-70">מחובר כ</p>
          <p className="truncate text-sm">{email}</p>
          <Button
            variant="ghost"
            className="mt-2 w-full justify-start text-sidebar-foreground hover:bg-white/10 hover:text-white"
            onClick={() => {
              sessionStorage.clear();
              router.push("/");
            }}
          >
            <LogOut />
            התנתקות
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
