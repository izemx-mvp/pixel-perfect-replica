import { createContext, useContext, useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DEFAULT_FILTERS, downloadCSV, type Filters } from "@/data/rapports";
import { cn } from "@/lib/utils";

export type Rows = { title: string; head: string[]; rows: (string | number)[][] };
type Ctx = {
  filters: Filters; setFilters: (f: Filters) => void; q: string; setQ: (s: string) => void;
  showRows: (r: Rows) => void; go: (vue: string, id?: string, prompt?: string) => void;
};
export const RapportsCtx = createContext<Ctx | null>(null);
export const useR = () => useContext(RapportsCtx)!;

export function RapportsProvider({ children, go }: { children: ReactNode; go: Ctx["go"] }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Rows | null>(null);
  return (
    <RapportsCtx.Provider value={{ filters, setFilters, q, setQ, showRows: setRows, go }}>
      {children}
      <Sheet open={!!rows} onOpenChange={(o) => !o && setRows(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{rows?.title}</SheetTitle>
            <SheetDescription>{rows?.rows.length} ligne(s) — données sous-jacentes</SheetDescription>
          </SheetHeader>
          {rows && (
            <div className="px-4 pb-6">
              <Button size="sm" variant="outline" className="mb-3" onClick={() => downloadCSV("donnees.csv", [rows.head, ...rows.rows])}>
                <Download className="size-4" /> Exporter en Excel
              </Button>
              <DataTable head={rows.head} rows={rows.rows} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </RapportsCtx.Provider>
  );
}

export function DataTable({ head, rows, onRow, max }: { head: string[]; rows: (string | number | ReactNode)[][]; onRow?: (i: number) => void; max?: number }) {
  const list = max ? rows.slice(0, max) : rows;
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {list.length === 0 && <tr><td colSpan={head.length} className="px-3 py-6 text-center text-muted-foreground">Aucun résultat trouvé.</td></tr>}
          {list.map((r, i) => (
            <tr key={i} onClick={onRow ? () => onRow(i) : undefined} className={cn("border-t border-border", onRow && "cursor-pointer hover:bg-primary/5")}>
              {r.map((c, j) => <td key={j} className="whitespace-nowrap px-3 py-2">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KpiCard({ label, value, sub, onClick, highlight }: { label: string; value: string; sub?: string; onClick?: () => void; highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn("panel hover-lift rounded-xl p-4 text-left transition", highlight && "ring-2 ring-primary", onClick && "cursor-pointer")}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-display text-2xl font-extrabold", highlight && "text-primary")}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </button>
  );
}

export function Evo({ cur, prev }: { cur: number; prev: number }) {
  if (!prev) return <span className="text-xs text-muted-foreground">—</span>;
  const e = ((cur - prev) / prev) * 100;
  return <span className={cn("text-xs font-semibold", e >= 0 ? "text-success" : "text-primary")}>{e >= 0 ? "+" : ""}{e.toFixed(1).replace(".", ",")} %</span>;
}
