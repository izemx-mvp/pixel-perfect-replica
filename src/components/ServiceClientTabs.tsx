import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, FileText, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/faq", label: "FAQ", icon: BookOpen },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/informations", label: "Informations générales", icon: Info },
] as const;

/** Interface 03 — Service Client: exactly three tabs. */
export function ServiceClientTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="font-display text-4xl font-black leading-none text-primary/25">03</span>
        <div>
          <p className="text-kicker">Interface</p>
          <p className="font-display text-xl font-extrabold">Service Client</p>
        </div>
      </div>
      <nav className="flex gap-1 rounded-full border border-border bg-card/70 p-1 backdrop-blur" aria-label="Onglets Service Client">
        {TABS.map((t) => (
          <Link key={t.to} to={t.to} className={cn("flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors", pathname === t.to ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            <t.icon className="size-4" /> <span className={cn(t.to === "/informations" && "hidden sm:inline")}>{t.label}</span>
            {t.to === "/informations" && <span className="sm:hidden">Infos</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}
