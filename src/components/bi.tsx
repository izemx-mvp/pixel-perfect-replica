import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function InterfaceHeader({
  num,
  kicker,
  title,
  subtitle,
  actions,
}: {
  num: string;
  kicker: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 animate-rise">
      <div className="flex items-start gap-4">
        <span className="font-display text-5xl font-black leading-none text-primary/25 sm:text-6xl">{num}</span>
        <div>
          <p className="text-kicker">{kicker}</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl p-5 panel", className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h3 className="font-display text-base font-bold">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  prev,
  current,
  hint,
  invert,
  suffix,
}: {
  label: string;
  value: string;
  current?: number | undefined;
  prev?: number | undefined;
  hint: string;
  invert?: boolean | undefined;
  suffix?: string | undefined;
}) {
  const evo = prev && current !== undefined ? ((current - prev) / prev) * 100 : null;
  const good = evo === null ? true : invert ? evo <= 0 : evo >= 0;
  return (
    <div className="group rounded-xl p-4 panel hover-lift">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <button aria-label={`À propos : ${label}`} className="text-muted-foreground hover:text-primary">
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-60">{hint}</TooltipContent>
        </Tooltip>
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold">
        {value}
        {suffix && <span className="ml-1 text-sm text-muted-foreground">{suffix}</span>}
      </p>
      {evo !== null && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold",
              good ? "bg-success/15 text-success" : "bg-primary/12 text-primary",
            )}
          >
            {evo >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(evo).toFixed(1).replace(".", ",")} %
          </span>
          <span className="text-muted-foreground">vs période préc.</span>
        </div>
      )}
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(8, 50 + (evo ?? 0)))}%` }}
        />
      </div>
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: "red" | "green" | "amber" | "grey"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "red" && "bg-primary/12 text-primary",
        tone === "green" && "bg-success/15 text-success",
        tone === "amber" && "bg-warning/15 text-warning",
        tone === "grey" && "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export const chartTooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
};
