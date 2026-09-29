import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  Download,
  FileDown,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { InterfaceHeader, Kpi, Panel, StatusPill, chartTooltipStyle } from "@/components/bi";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  CATEGORIES,
  CHART_COLORS,
  COMMERCIALS,
  OFFERS,
  PRODUCTS,
  REGIONS,
  SALES,
  SECTORS_BI,
  TODAY,
  daysBetween,
  downloadCSV,
  fmtDate,
  fmtK,
  fmtMAD,
  stockStatus,
  type Offer,
  type SaleRecord,
} from "@/data/business";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analyse")({
  head: () => ({
    meta: [
      { title: "Analyse & Reporting — Rousseau Distribution" },
      { name: "description", content: "Tableau de bord BI Rousseau Distribution : KPIs, ventes, performance commerciale, demande, stock, offres et rapports IA." },
      { property: "og:title", content: "Analyse & Reporting — Rousseau Distribution" },
      { property: "og:description", content: "KPIs, analyses commerciales et rapports IA à partir des données consolidées." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <AnalysePage />
    </AppShell>
  ),
});

type Filters = { period: string; commercial: string; product: string; category: string; sector: string; region: string };
const DEFAULT_F: Filters = { period: "90", commercial: "all", product: "all", category: "all", sector: "all", region: "all" };
const PERIODS = [
  ["30", "30 derniers jours"],
  ["90", "90 derniers jours"],
  ["180", "6 derniers mois"],
  ["365", "12 derniers mois"],
] as const;

type Rec = SaleRecord | Offer;
function matches(r: Rec, f: Filters) {
  return (
    (f.commercial === "all" || r.commercial === f.commercial) &&
    (f.product === "all" || r.reference === f.product) &&
    (f.category === "all" || r.category === f.category) &&
    (f.sector === "all" || r.sector === f.sector) &&
    (f.region === "all" || r.region === f.region)
  );
}
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);
const fmtPct = (n: number) => `${n.toFixed(1).replace(".", ",")} %`;

function groupSum<T>(rows: T[], key: (r: T) => string, val: (r: T) => number) {
  const m = new Map<string, number>();
  rows.forEach((r) => m.set(key(r), (m.get(key(r)) ?? 0) + val(r)));
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function useSlices(f: Filters) {
  return useMemo(() => {
    const P = Number(f.period);
    const inCur = (r: Rec) => daysBetween(r.date) < P;
    const inPrev = (r: Rec) => {
      const d = daysBetween(r.date);
      return d >= P && d < 2 * P;
    };
    const s = SALES.filter((r) => matches(r, f));
    const o = OFFERS.filter((r) => matches(r, f));
    return {
      P,
      sales: s.filter(inCur),
      prevSales: s.filter(inPrev),
      offers: o.filter(inCur),
      prevOffers: o.filter(inPrev),
      hasPrev: 2 * P <= 365,
    };
  }, [f]);
}

function stats(sales: SaleRecord[], offers: Offer[]) {
  const ca = sum(sales.map((s) => s.amount));
  const orders = new Set(sales.map((s) => s.company + s.date)).size;
  const won = offers.filter((x) => x.status === "Gagnée");
  const lost = offers.filter((x) => x.status === "Perdue");
  const pending = offers.filter((x) => x.status === "En attente");
  return {
    ca,
    lines: sales.length,
    orders,
    basket: orders ? ca / orders : 0,
    qty: sum(sales.map((s) => s.quantity)),
    refs: new Set([...sales, ...offers].map((r) => r.reference)).size,
    conv: pct(won.length, won.length + lost.length),
    won: won.length,
    lost: lost.length,
    pending: pending.length,
    pipeline: sum(pending.map((x) => x.amount)),
    wonValue: sum(won.map((x) => x.amount)),
    lostValue: sum(lost.map((x) => x.amount)),
  };
}

function AnalysePage() {
  const [f, setF] = useState<Filters>(DEFAULT_F);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("overview");
  const sl = useSlices(f);
  const cur = stats(sl.sales, sl.offers);
  const prev = sl.hasPrev ? stats(sl.prevSales, sl.prevOffers) : null;

  const set = (k: keyof Filters) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const activeFilters = Object.entries(f).filter(([k, v]) => k !== "period" && v !== "all").length;

  const products = PRODUCTS.filter((p) => (f.product === "all" || p.reference === f.product) && (f.category === "all" || p.category === f.category));
  const stockValue = sum(products.map((p) => p.stock * p.price));
  const demandByRef = groupSum([...sl.sales, ...sl.offers], (r) => r.reference, () => 1);
  const avgDemand = demandByRef.length ? sum(demandByRef.map((d) => d.value)) / demandByRef.length : 0;
  const highDemand = demandByRef.filter((d) => d.value >= avgDemand * 1.2).length;

  return (
    <div className="space-y-6">
      <InterfaceHeader
        num="01"
        kicker="Business Intelligence · Aide à la décision"
        title="Analyse & Reporting"
        subtitle="Les données consolidées transformées en KPIs, tendances, comparaisons et insights IA."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                downloadCSV(
                  `rousseau-analyse-${f.period}j.csv`,
                  sl.sales.map((s) => ({ Date: s.date, Société: s.company, Commercial: s.commercial, Secteur: s.sector, Région: s.region, Catégorie: s.category, Référence: s.reference, Quantité: s.quantity, Montant: s.amount })),
                );
                toast.success("Export des données lancé", { description: `${sl.sales.length} lignes exportées (CSV)` });
              }}
            >
              <Download className="size-4" /> Exporter les données
            </Button>
            <Button
              variant="outline"
              disabled={refreshing}
              onClick={() => {
                setRefreshing(true);
                setTimeout(() => {
                  setRefreshing(false);
                  toast.success("Analyse actualisée", { description: "Données consolidées rechargées." });
                }, 900);
              }}
            >
              <RefreshCw className={cn("size-4", refreshing && "animate-spin")} /> Actualiser
            </Button>
            <Button onClick={() => setTab("report")}>
              <Sparkles className="size-4" /> Générer un rapport IA
            </Button>
          </>
        }
      />

      {/* Global filters */}
      <div className="sticky top-16 z-30 -mx-1 rounded-xl p-3 panel backdrop-blur-md">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
          <FilterSelect label="Période" value={f.period} onChange={set("period")} options={PERIODS.map(([v, l]) => [v, l])} noAll />
          <FilterSelect label="Commercial" value={f.commercial} onChange={set("commercial")} options={COMMERCIALS.map((c) => [c, c])} />
          <FilterSelect label="Produit" value={f.product} onChange={set("product")} options={PRODUCTS.map((p) => [p.reference, p.reference])} />
          <FilterSelect label="Catégorie" value={f.category} onChange={set("category")} options={CATEGORIES.map((c) => [c, c])} />
          <FilterSelect label="Secteur" value={f.sector} onChange={set("sector")} options={SECTORS_BI.map((c) => [c, c])} />
          <FilterSelect label="Région" value={f.region} onChange={set("region")} options={REGIONS.map((c) => [c, c])} />
          <Button variant="ghost" className="self-end" onClick={() => { setF(DEFAULT_F); toast("Filtres réinitialisés"); }} disabled={activeFilters === 0 && f.period === DEFAULT_F.period}>
            <RotateCcw className="size-4" /> Réinitialiser {activeFilters > 0 && `(${activeFilters})`}
          </Button>
        </div>
      </div>

      <div className={cn("transition-opacity", refreshing && "opacity-50")}>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {[
              ["overview", "Vue exécutive"],
              ["sales", "Ventes"],
              ["commercial", "Commerciaux"],
              ["sector", "Secteurs"],
              ["demand", "Demande"],
              ["stock", "Stock vs Demande"],
              ["offers", "Offres"],
              ["insights", "Insights IA"],
              ["report", "Rapport IA"],
            ].map(([v, l]) => (
              <TabsTrigger key={v} value={v} className="rounded-full border border-border px-4 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {l}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6 animate-rise">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <Kpi label="Chiffre d'affaires" value={fmtK(cur.ca)} current={cur.ca} prev={prev?.ca} hint="Somme des montants facturés sur la période (données Sage consolidées)." />
              <Kpi label="Nombre de ventes" value={String(cur.lines)} current={cur.lines} prev={prev?.lines} hint="Nombre de lignes de vente enregistrées." />
              <Kpi label="Commandes" value={String(cur.orders)} current={cur.orders} prev={prev?.orders} hint="Commandes distinctes (client × date)." />
              <Kpi label="Panier moyen" value={fmtK(cur.basket)} current={cur.basket} prev={prev?.basket} hint="Chiffre d'affaires divisé par le nombre de commandes." />
              <Kpi label="Produits vendus" value={cur.qty.toLocaleString("fr-FR")} current={cur.qty} prev={prev?.qty} hint="Quantité totale d'articles vendus." />
              <Kpi label="Références demandées" value={String(cur.refs)} current={cur.refs} prev={prev?.refs} hint="Références distinctes présentes dans les ventes et les offres." />
              <Kpi label="Taux de conversion" value={fmtPct(cur.conv)} current={cur.conv} prev={prev?.conv} hint="Offres gagnées / (gagnées + perdues)." />
              <Kpi label="Offres gagnées" value={String(cur.won)} current={cur.won} prev={prev?.won} hint="Offres converties en commande." />
              <Kpi label="Offres en attente" value={String(cur.pending)} current={cur.pending} prev={prev?.pending} hint="Offres en attente de décision client." />
              <Kpi label="Offres perdues" value={String(cur.lost)} current={cur.lost} prev={prev?.lost} invert hint="Offres non converties." />
              <Kpi label="Valeur du pipeline" value={fmtK(cur.pipeline)} current={cur.pipeline} prev={prev?.pipeline} hint="Montant cumulé des offres en attente." />
              <Kpi label="Niveau de stock" value={fmtK(stockValue)} hint="Valeur du stock disponible (quantité × prix) pour la sélection." />
              <Kpi label="Forte demande" value={String(highDemand)} suffix="réf." hint="Références dont la demande dépasse de 20 % la moyenne de la période." />
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <RevenueChart sales={sl.sales} period={sl.P} className="lg:col-span-2" />
              <InsightsList sales={sl.sales} prevSales={sl.prevSales} offers={sl.offers} compact />
            </div>
          </TabsContent>

          <TabsContent value="sales" className="mt-6 space-y-6 animate-rise">
            <RevenueChart sales={sl.sales} period={sl.P} />
            <Distribution sales={sl.sales} />
            <TopProducts sales={sl.sales} prevSales={sl.prevSales} />
          </TabsContent>

          <TabsContent value="commercial" className="mt-6 animate-rise">
            <Commercials sales={sl.sales} prevSales={sl.prevSales} offers={sl.offers} />
          </TabsContent>

          <TabsContent value="sector" className="mt-6 animate-rise">
            <Sectors sales={sl.sales} prevSales={sl.prevSales} offers={sl.offers} />
          </TabsContent>

          <TabsContent value="demand" className="mt-6 animate-rise">
            <Demand sales={sl.sales} prevSales={sl.prevSales} offers={sl.offers} prevOffers={sl.prevOffers} />
          </TabsContent>

          <TabsContent value="stock" className="mt-6 animate-rise">
            <StockDemand f={f} />
          </TabsContent>

          <TabsContent value="offers" className="mt-6 animate-rise">
            <Offers offers={sl.offers} />
          </TabsContent>

          <TabsContent value="insights" className="mt-6 animate-rise">
            <InsightsList sales={sl.sales} prevSales={sl.prevSales} offers={sl.offers} />
          </TabsContent>

          <TabsContent value="report" className="mt-6 animate-rise">
            <Report f={f} cur={cur} prev={prev} sales={sl.sales} prevSales={sl.prevSales} offers={sl.offers} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, noAll }: { label: string; value: string; onChange: (v: string) => void; options: (readonly [string, string])[] | string[][]; noAll?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn("h-9 w-full", value !== "all" && !noAll && "border-primary text-primary")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {!noAll && <SelectItem value="all">Tous</SelectItem>}
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v ?? ""}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function Empty() {
  return <p className="py-10 text-center text-sm text-muted-foreground">Aucun résultat trouvé pour ces filtres.</p>;
}

/* ---------- Sales ---------- */
function bucket(date: string, g: "day" | "week" | "month") {
  if (g === "day") return date;
  if (g === "month") return date.slice(0, 7);
  const d = new Date(date + "T12:00:00");
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}
function labelOf(k: string, g: "day" | "week" | "month") {
  if (g === "month") return new Date(k + "-01T12:00:00").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
  return new Date(k + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function RevenueChart({ sales, period, className }: { sales: SaleRecord[]; period: number; className?: string }) {
  const [g, setG] = useState<"day" | "week" | "month">(period <= 30 ? "day" : period <= 180 ? "week" : "month");
  const data = useMemo(() => {
    const m = new Map<string, number>();
    sales.forEach((s) => {
      const k = bucket(s.date, g);
      m.set(k, (m.get(k) ?? 0) + s.amount);
    });
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({ name: labelOf(k, g), CA: v }));
  }, [sales, g]);
  return (
    <Panel
      className={className}
      title="Chiffre d'affaires dans le temps"
      subtitle={`${fmtMAD(sum(sales.map((s) => s.amount)))} sur la période`}
      action={
        <div className="flex rounded-full border border-border p-0.5">
          {([["day", "Jour"], ["week", "Semaine"], ["month", "Mois"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setG(v)} className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", g === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {l}
            </button>
          ))}
        </div>
      }
    >
      {data.length === 0 ? <Empty /> : (
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="ca" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={16} />
              <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={40} />
              <RTooltip contentStyle={chartTooltipStyle} formatter={(v: number) => fmtMAD(v)} />
              <Area type="monotone" dataKey="CA" stroke="var(--primary)" strokeWidth={2} fill="url(#ca)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

const DIMENSIONS = [
  ["category", "Catégorie"],
  ["reference", "Produit"],
  ["commercial", "Commercial"],
  ["sector", "Secteur"],
  ["region", "Région"],
] as const;

function Distribution({ sales }: { sales: SaleRecord[] }) {
  const [dim, setDim] = useState<(typeof DIMENSIONS)[number][0]>("category");
  const data = groupSum(sales, (s) => s[dim], (s) => s.amount).slice(0, 9);
  const total = sum(data.map((d) => d.value));
  return (
    <Panel
      title="Répartition des ventes"
      subtitle="Part du chiffre d'affaires par dimension"
      action={
        <div className="flex flex-wrap gap-1">
          {DIMENSIONS.map(([v, l]) => (
            <button key={v} onClick={() => setDim(v)} className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors", dim === v ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
              {l}
            </button>
          ))}
        </div>
      }
    >
      {data.length === 0 ? <Empty /> : (
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <RTooltip contentStyle={chartTooltipStyle} formatter={(v: number) => fmtMAD(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2">
            {data.map((d, i) => (
              <li key={d.name} className="text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="truncate">{d.name}</span>
                  </span>
                  <span className="font-semibold">{fmtPct(pct(d.value, total))}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct(d.value, data[0]!.value)}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

function Evo({ v }: { v: number | null }) {
  if (v === null || !isFinite(v)) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", v >= 0 ? "text-success" : "text-primary")}>
      {v >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
      {v >= 0 ? "+" : ""}
      {v.toFixed(0)} %
    </span>
  );
}
const evo = (a: number, b: number) => (b ? ((a - b) / b) * 100 : null);

function TopProducts({ sales, prevSales }: { sales: SaleRecord[]; prevSales: SaleRecord[] }) {
  const total = sum(sales.map((s) => s.amount));
  const rows = groupSum(sales, (s) => s.reference, (s) => s.amount).slice(0, 10).map((r) => {
    const p = PRODUCTS.find((x) => x.reference === r.name)!;
    return {
      ...r,
      product: p,
      qty: sum(sales.filter((s) => s.reference === r.name).map((s) => s.quantity)),
      prev: sum(prevSales.filter((s) => s.reference === r.name).map((s) => s.amount)),
    };
  });
  return (
    <Panel title="Top produits" subtitle="Produits les plus vendus sur la période">
      {rows.length === 0 ? <Empty /> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead className="hidden md:table-cell">Catégorie</TableHead>
              <TableHead className="text-right">Quantité</TableHead>
              <TableHead className="text-right">CA</TableHead>
              <TableHead className="text-right">Évolution</TableHead>
              <TableHead className="text-right">Part</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.name}>
                <TableCell>
                  <p className="font-medium">{r.product.name}</p>
                  <p className="text-xs text-muted-foreground">{r.name}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell">{r.product.category}</TableCell>
                <TableCell className="text-right">{r.qty.toLocaleString("fr-FR")}</TableCell>
                <TableCell className="text-right font-semibold">{fmtK(r.value)}</TableCell>
                <TableCell className="text-right"><Evo v={evo(r.value, r.prev)} /></TableCell>
                <TableCell className="text-right">{fmtPct(pct(r.value, total))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}

/* ---------- Commercials ---------- */
function comStats(name: string, sales: SaleRecord[], prevSales: SaleRecord[], offers: Offer[]) {
  const s = sales.filter((x) => x.commercial === name);
  const o = offers.filter((x) => x.commercial === name);
  const won = o.filter((x) => x.status === "Gagnée");
  const lost = o.filter((x) => x.status === "Perdue");
  const ca = sum(s.map((x) => x.amount));
  return {
    name,
    ca,
    prev: sum(prevSales.filter((x) => x.commercial === name).map((x) => x.amount)),
    clients: new Set(s.map((x) => x.company)).size,
    opps: o.length,
    won: won.length,
    pending: o.filter((x) => x.status === "En attente").length,
    lost: lost.length,
    conv: pct(won.length, won.length + lost.length),
    avgDeal: won.length ? sum(won.map((x) => x.amount)) / won.length : 0,
  };
}

function Commercials({ sales, prevSales, offers }: { sales: SaleRecord[]; prevSales: SaleRecord[]; offers: Offer[] }) {
  const [sel, setSel] = useState<string | null>(null);
  const rows = COMMERCIALS.map((c) => comStats(c, sales, prevSales, offers)).sort((a, b) => b.ca - a.ca);

  if (sel) {
    const r = rows.find((x) => x.name === sel)!;
    const s = sales.filter((x) => x.commercial === sel);
    const monthly = groupSum(s, (x) => x.date.slice(0, 7), (x) => x.amount).sort((a, b) => a.name.localeCompare(b.name)).map((m) => ({ name: labelOf(m.name, "month"), CA: m.value }));
    const topP = groupSum(s, (x) => x.reference, (x) => x.amount).slice(0, 5);
    const topC = groupSum(s, (x) => x.company, (x) => x.amount).slice(0, 5);
    const recentOffers = offers.filter((x) => x.commercial === sel).slice(0, 8);
    return (
      <div className="space-y-6 animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => setSel(null)}><ArrowLeft className="size-4" /> Tous les commerciaux</Button>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{sel.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
            <div>
              <p className="font-display text-lg font-bold">{sel}</p>
              <p className="text-xs text-muted-foreground">Rang #{rows.findIndex((x) => x.name === sel) + 1} sur {rows.length}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label="Chiffre d'affaires" value={fmtK(r.ca)} current={r.ca} prev={r.prev || undefined} hint="CA réalisé par ce commercial." />
          <Kpi label="Clients" value={String(r.clients)} hint="Clients distincts facturés." />
          <Kpi label="Conversion" value={fmtPct(r.conv)} hint="Gagnées / (gagnées + perdues)." />
          <Kpi label="Affaire moyenne" value={fmtK(r.avgDeal)} hint="Montant moyen des offres gagnées." />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel title="Évolution des ventes" className="lg:col-span-2">
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={40} />
                  <RTooltip contentStyle={chartTooltipStyle} formatter={(v: number) => fmtMAD(v)} />
                  <Line type="monotone" dataKey="CA" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="Offres">
            <div className="space-y-3">
              {[["Opportunités", r.opps, "grey"], ["Gagnées", r.won, "green"], ["En attente", r.pending, "amber"], ["Perdues", r.lost, "red"]].map(([l, v, t]) => (
                <div key={l as string} className="flex items-center justify-between"><span className="text-sm">{l}</span><StatusPill tone={t as "grey"}>{v as number}</StatusPill></div>
              ))}
            </div>
          </Panel>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Panel title="Top produits">
            <RankList rows={topP} />
          </Panel>
          <Panel title="Top clients">
            <RankList rows={topC} />
          </Panel>
        </div>
        <Panel title="Offres récentes">
          <OfferTable rows={recentOffers} />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Panel title="Classement commercial" subtitle="Chiffre d'affaires par commercial — période courante vs précédente">
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={rows.map((r) => ({ name: r.name.split(" ")[0], Actuel: r.ca, Précédent: r.prev }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={40} />
              <RTooltip contentStyle={chartTooltipStyle} formatter={(v: number) => fmtMAD(v)} cursor={{ fill: "var(--muted)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Précédent" fill="var(--steel)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actuel" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((r, i) => (
          <button key={r.name} onClick={() => setSel(r.name)} className="rounded-xl p-5 text-left panel hover-lift focus-visible:outline-2 focus-visible:outline-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/12 text-sm font-bold text-primary">#{i + 1}</span>
                <p className="font-display font-bold">{r.name}</p>
              </div>
              <Evo v={evo(r.ca, r.prev)} />
            </div>
            <p className="mt-3 font-display text-2xl font-extrabold">{fmtK(r.ca)}</p>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div><dt className="text-muted-foreground">Clients</dt><dd className="font-semibold">{r.clients}</dd></div>
              <div><dt className="text-muted-foreground">Opport.</dt><dd className="font-semibold">{r.opps}</dd></div>
              <div><dt className="text-muted-foreground">Conversion</dt><dd className="font-semibold">{fmtPct(r.conv)}</dd></div>
              <div><dt className="text-muted-foreground">Gagnées</dt><dd className="font-semibold text-success">{r.won}</dd></div>
              <div><dt className="text-muted-foreground">En attente</dt><dd className="font-semibold text-warning">{r.pending}</dd></div>
              <div><dt className="text-muted-foreground">Perdues</dt><dd className="font-semibold text-primary">{r.lost}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">Affaire moyenne {fmtK(r.avgDeal)} · <span className="text-primary">Voir le détail →</span></p>
          </button>
        ))}
      </div>
    </div>
  );
}

function RankList({ rows }: { rows: { name: string; value: number }[] }) {
  if (!rows.length) return <Empty />;
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => (
        <li key={r.name} className="flex items-center justify-between gap-2 text-sm">
          <span className="flex min-w-0 items-center gap-2"><span className="w-5 text-xs text-muted-foreground">{i + 1}.</span><span className="truncate">{r.name}</span></span>
          <span className="font-semibold">{fmtK(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Sectors ---------- */
function Sectors({ sales, prevSales, offers }: { sales: SaleRecord[]; prevSales: SaleRecord[]; offers: Offer[] }) {
  const rows = SECTORS_BI.map((sec) => {
    const s = sales.filter((x) => x.sector === sec);
    const o = offers.filter((x) => x.sector === sec);
    return {
      sec,
      ca: sum(s.map((x) => x.amount)),
      prev: sum(prevSales.filter((x) => x.sector === sec).map((x) => x.amount)),
      demand: s.length + o.length,
      refs: new Set([...s, ...o].map((x) => x.reference)).size,
      top: groupSum([...s, ...o], (x) => x.reference, () => 1)[0]?.name ?? "—",
      com: groupSum(s, (x) => x.commercial, (x) => x.amount)[0]?.name ?? "—",
    };
  }).filter((r) => r.ca > 0 || r.demand > 0).sort((a, b) => b.ca - a.ca);
  return (
    <div className="space-y-6">
      <Panel title="Chiffre d'affaires et demande par secteur">
        {rows.length === 0 ? <Empty /> : (
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={rows.map((r) => ({ name: r.sec, CA: r.ca, Demande: r.demand }))} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={110} />
                <RTooltip contentStyle={chartTooltipStyle} formatter={(v: number, n) => (n === "CA" ? fmtMAD(v) : v)} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="CA" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>
      <Panel title="Détail par secteur">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Secteur</TableHead>
              <TableHead className="text-right">CA</TableHead>
              <TableHead className="text-right">Demandes</TableHead>
              <TableHead className="text-right hidden md:table-cell">Références</TableHead>
              <TableHead className="hidden lg:table-cell">Produit le plus demandé</TableHead>
              <TableHead className="hidden lg:table-cell">Commercial actif</TableHead>
              <TableHead className="text-right">Évolution</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.sec}>
                <TableCell className="font-medium">{r.sec}</TableCell>
                <TableCell className="text-right font-semibold">{fmtK(r.ca)}</TableCell>
                <TableCell className="text-right">{r.demand}</TableCell>
                <TableCell className="text-right hidden md:table-cell">{r.refs}</TableCell>
                <TableCell className="hidden lg:table-cell">{r.top}</TableCell>
                <TableCell className="hidden lg:table-cell">{r.com}</TableCell>
                <TableCell className="text-right"><Evo v={evo(r.ca, r.prev)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}

/* ---------- Demand ---------- */
function Demand({ sales, prevSales, offers, prevOffers }: { sales: SaleRecord[]; prevSales: SaleRecord[]; offers: Offer[]; prevOffers: Offer[] }) {
  const all = [...sales, ...offers];
  const prevAll = [...prevSales, ...prevOffers];
  const refs = groupSum(all, (x) => x.reference, () => 1);
  const max = refs[0]?.value ?? 1;
  const repeated = groupSum(all, (x) => ("company" in x ? x.company : x.client) + "|" + x.reference, () => 1).filter((x) => x.value >= 3).length;
  const monthly = groupSum(all, (x) => x.date.slice(0, 7), () => 1).sort((a, b) => a.name.localeCompare(b.name)).map((m) => ({ name: labelOf(m.name, "month"), Demandes: m.value }));
  const bySector = groupSum(all, (x) => x.sector, () => 1);
  const byCom = groupSum(all, (x) => x.commercial, () => 1);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Demandes totales" value={String(all.length)} current={all.length} prev={prevAll.length || undefined} hint="Lignes de vente + offres sur la période." />
        <Kpi label="Références demandées" value={String(refs.length)} hint="Références distinctes demandées." />
        <Kpi label="Demandes répétées" value={String(repeated)} hint="Couples client × référence demandés 3 fois ou plus." />
        <Kpi label="Quantité demandée" value={sum(all.map((x) => x.quantity)).toLocaleString("fr-FR")} hint="Somme des quantités demandées." />
      </div>
      <Panel title="Top références demandées">
        {refs.length === 0 ? <Empty /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead className="hidden md:table-cell">Produit</TableHead>
                <TableHead className="text-right">Demandes</TableHead>
                <TableHead className="text-right">Qté demandée</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Statut stock</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead className="text-right">Tendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refs.slice(0, 12).map((r) => {
                const p = PRODUCTS.find((x) => x.reference === r.name)!;
                const st = stockStatus(p);
                const level = r.value >= max * 0.66 ? "Forte" : r.value >= max * 0.33 ? "Moyenne" : "Faible";
                const prevN = prevAll.filter((x) => x.reference === r.name).length;
                return (
                  <TableRow key={r.name}>
                    <TableCell className="font-mono text-xs font-semibold">{r.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{p.name}</TableCell>
                    <TableCell className="text-right font-semibold">{r.value}</TableCell>
                    <TableCell className="text-right">{sum(all.filter((x) => x.reference === r.name).map((x) => x.quantity)).toLocaleString("fr-FR")}</TableCell>
                    <TableCell className="text-right">{p.stock}</TableCell>
                    <TableCell><StatusPill tone={st === "Rupture" ? "red" : st === "Stock faible" ? "amber" : st === "Surstock" ? "grey" : "green"}>{st}</StatusPill></TableCell>
                    <TableCell><StatusPill tone={level === "Forte" ? "red" : level === "Moyenne" ? "amber" : "grey"}>{level}</StatusPill></TableCell>
                    <TableCell className="text-right"><Evo v={evo(r.value, prevN)} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Panel>
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Évolution de la demande" className="lg:col-span-2">
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
                <RTooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="Demandes" fill="var(--graphite)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Demande par secteur / commercial">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Secteurs</p>
          <ul className="mb-4 space-y-1 text-sm">{bySector.slice(0, 4).map((s) => <li key={s.name} className="flex justify-between"><span>{s.name}</span><b>{s.value}</b></li>)}</ul>
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Commerciaux</p>
          <ul className="space-y-1 text-sm">{byCom.slice(0, 4).map((s) => <li key={s.name} className="flex justify-between"><span>{s.name}</span><b>{s.value}</b></li>)}</ul>
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Stock vs demand ---------- */
function stockRows(f: Filters) {
  return PRODUCTS.filter((p) => (f.product === "all" || p.reference === f.product) && (f.category === "all" || p.category === f.category)).map((p) => {
    const lines = SALES.filter((s) => s.reference === p.reference && matches(s, { ...f, product: "all", category: "all" }));
    const avg = sum(lines.map((s) => s.quantity)) / 12;
    const recent = sum(lines.filter((s) => daysBetween(s.date) < 30).map((s) => s.quantity));
    const prev = sum(lines.filter((s) => daysBetween(s.date) >= 30 && daysBetween(s.date) < 60).map((s) => s.quantity));
    const pressure = p.stock === 0 ? 999 : (recent / p.stock) * 100;
    return { p, avg, recent, trend: evo(recent, prev), pressure, status: stockStatus(p), high: recent >= avg * 0.9 && avg > 0 };
  });
}

function StockDemand({ f }: { f: Filters }) {
  const rows = stockRows(f);
  const groups = [
    { t: "Forte demande + stock faible", tone: "red" as const, items: rows.filter((r) => r.high && (r.status === "Stock faible" || r.status === "Rupture")), hint: "Risque de rupture — réapprovisionnement prioritaire." },
    { t: "Forte demande + stock suffisant", tone: "green" as const, items: rows.filter((r) => r.high && (r.status === "Disponible" || r.status === "Surstock")), hint: "Situation saine — maintenir le niveau." },
    { t: "Faible demande + stock élevé", tone: "amber" as const, items: rows.filter((r) => !r.high && (r.status === "Surstock" || r.status === "Disponible")), hint: "Stock immobilisé — opportunité de promotion." },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {groups.map((g) => (
          <div key={g.t} className="rounded-xl p-5 panel">
            <StatusPill tone={g.tone}>{g.items.length} référence{g.items.length > 1 ? "s" : ""}</StatusPill>
            <p className="mt-3 font-display font-bold">{g.t}</p>
            <p className="text-xs text-muted-foreground">{g.hint}</p>
            <ul className="mt-3 space-y-1 text-xs">{g.items.slice(0, 4).map((r) => <li key={r.p.reference} className="font-mono">{r.p.reference}</li>)}</ul>
          </div>
        ))}
      </div>
      <Panel title="Stock actuel vs demande récente (30 j)">
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={rows.map((r) => ({ name: r.p.reference, Stock: r.p.stock, "Demande 30 j": r.recent }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={70} />
              <YAxis scale="sqrt" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={40} />
              <RTooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Stock" fill="var(--steel)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Demande 30 j" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Intelligence stock">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Demande moy./mois</TableHead>
              <TableHead className="text-right">Demande 30 j</TableHead>
              <TableHead className="text-right">Tendance</TableHead>
              <TableHead>Pression</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.sort((a, b) => b.pressure - a.pressure).map((r) => (
              <TableRow key={r.p.reference}>
                <TableCell><p className="font-medium">{r.p.name}</p><p className="font-mono text-xs text-muted-foreground">{r.p.reference}</p></TableCell>
                <TableCell className="text-right">{r.p.stock}</TableCell>
                <TableCell className="text-right">{Math.round(r.avg)}</TableCell>
                <TableCell className="text-right">{r.recent}</TableCell>
                <TableCell className="text-right"><Evo v={r.trend} /></TableCell>
                <TableCell className="min-w-28">
                  <div className="h-2 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", r.pressure > 80 ? "bg-primary" : r.pressure > 40 ? "bg-warning" : "bg-success")} style={{ width: `${Math.min(100, r.pressure)}%` }} /></div>
                  <span className="text-[11px] text-muted-foreground">{r.pressure >= 999 ? "Critique" : `${Math.round(r.pressure)} %`}</span>
                </TableCell>
                <TableCell><StatusPill tone={r.status === "Rupture" ? "red" : r.status === "Stock faible" ? "amber" : r.status === "Surstock" ? "grey" : "green"}>{r.status}</StatusPill></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}

/* ---------- Offers ---------- */
function OfferTable({ rows }: { rows: Offer[] }) {
  if (!rows.length) return <Empty />;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Offre</TableHead>
          <TableHead>Client</TableHead>
          <TableHead className="hidden md:table-cell">Produit</TableHead>
          <TableHead className="text-right">Montant</TableHead>
          <TableHead className="hidden sm:table-cell">Date</TableHead>
          <TableHead>Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((o) => (
          <TableRow key={o.id}>
            <TableCell className="font-mono text-xs font-semibold">{o.id}</TableCell>
            <TableCell>{o.client}</TableCell>
            <TableCell className="hidden md:table-cell font-mono text-xs">{o.reference}</TableCell>
            <TableCell className="text-right font-semibold">{fmtK(o.amount)}</TableCell>
            <TableCell className="hidden sm:table-cell text-xs">{fmtDate(o.date)}</TableCell>
            <TableCell><StatusPill tone={o.status === "Gagnée" ? "green" : o.status === "Perdue" ? "red" : "amber"}>{o.status}</StatusPill></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Offers({ offers }: { offers: Offer[] }) {
  const [limit, setLimit] = useState(10);
  const st = stats([], offers);
  const donut = [
    { name: "Gagnées", value: st.won, fill: "var(--success)" },
    { name: "En attente", value: st.pending, fill: "var(--warning)" },
    { name: "Perdues", value: st.lost, fill: "var(--primary)" },
  ];
  const funnel = [
    ["Offres émises", offers.length],
    ["Actives (gagnées + en attente)", st.won + st.pending],
    ["Gagnées", st.won],
  ] as const;
  const trend = useMemo(() => {
    const m = new Map<string, { name: string; Gagnée: number; "En attente": number; Perdue: number }>();
    offers.forEach((o) => {
      const k = o.date.slice(0, 7);
      if (!m.has(k)) m.set(k, { name: k, Gagnée: 0, "En attente": 0, Perdue: 0 });
      m.get(k)![o.status]++;
    });
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name)).map((x) => ({ ...x, name: labelOf(x.name, "month") }));
  }, [offers]);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Offres totales" value={String(offers.length)} hint="Offres émises sur la période." />
        <Kpi label="Valeur estimée" value={fmtK(sum(offers.map((o) => o.amount)))} hint="Montant total des offres." />
        <Kpi label="Taux de conversion" value={fmtPct(st.conv)} hint="Gagnées / (gagnées + perdues)." />
        <Kpi label="Offre moyenne" value={fmtK(offers.length ? sum(offers.map((o) => o.amount)) / offers.length : 0)} hint="Montant moyen par offre." />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Répartition des offres">
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={donut} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {donut.map((d) => <Cell key={d.name} fill={d.fill} />)}
                </Pie>
                <RTooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Entonnoir de conversion">
          <div className="space-y-3 pt-2">
            {funnel.map(([l, v], i) => (
              <div key={l} className="mx-auto" style={{ width: `${100 - i * 18}%` }}>
                <div className="rounded-md px-3 py-3 text-center text-sm font-semibold text-primary-foreground" style={{ background: i === 2 ? "var(--primary)" : i === 1 ? "var(--graphite)" : "var(--steel)" }}>
                  {v}
                </div>
                <p className="mt-1 text-center text-xs text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Valeurs">
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between"><span>Gagnées</span><b className="text-success">{fmtK(st.wonValue)}</b></li>
            <li className="flex justify-between"><span>En attente (pipeline)</span><b className="text-warning">{fmtK(st.pipeline)}</b></li>
            <li className="flex justify-between"><span>Perdues</span><b className="text-primary">{fmtK(st.lostValue)}</b></li>
          </ul>
        </Panel>
      </div>
      <Panel title="Tendance des offres">
        <div className="h-60">
          <ResponsiveContainer>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
              <RTooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Gagnée" stackId="a" fill="var(--success)" />
              <Bar dataKey="En attente" stackId="a" fill="var(--warning)" />
              <Bar dataKey="Perdue" stackId="a" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Détail des offres" subtitle={`${offers.length} offres`}>
        <OfferTable rows={offers.slice(0, limit)} />
        {limit < offers.length && (
          <div className="mt-4 text-center"><Button variant="outline" onClick={() => setLimit((l) => l + 15)}>Afficher plus</Button></div>
        )}
      </Panel>
    </div>
  );
}

/* ---------- Insights ---------- */
type Insight = { cat: string; sev: "Élevée" | "Moyenne" | "Info"; kpi: string; text: string; reco: string };
function buildInsights(sales: SaleRecord[], prevSales: SaleRecord[], offers: Offer[]): Insight[] {
  const out: Insight[] = [];
  const skf = sum(sales.filter((s) => s.category === "Roulements").map((s) => s.quantity));
  const skfPrev = sum(prevSales.filter((s) => s.category === "Roulements").map((s) => s.quantity));
  const e = evo(skf, skfPrev);
  if (e !== null) out.push({ cat: "Demande", sev: Math.abs(e) > 15 ? "Élevée" : "Moyenne", kpi: "Quantité roulements", text: `La demande en roulements SKF a ${e >= 0 ? "augmenté" : "diminué"} de ${Math.abs(Math.round(e))} % cette période.`, reco: e >= 0 ? "Sécuriser les approvisionnements SKF sur les références 6205 et 22215." : "Relancer les clients maintenance sur les roulements." });
  const sec = groupSum(sales, (s) => s.sector, (s) => s.amount);
  const tot = sum(sec.map((s) => s.value));
  if (sec[0]) out.push({ cat: "Secteur", sev: "Info", kpi: "Répartition CA", text: `Le secteur ${sec[0].name} représente ${Math.round(pct(sec[0].value, tot))} % du chiffre d'affaires de la période.`, reco: "Renforcer la présence commerciale et le stock dédié à ce secteur." });
  const risky = PRODUCTS.filter((p) => stockStatus(p) === "Rupture" || stockStatus(p) === "Stock faible").filter((p) => sales.some((s) => s.reference === p.reference));
  if (risky.length) out.push({ cat: "Stock", sev: "Élevée", kpi: "Stock vs demande", text: `${risky.length} références présentent une forte demande avec un niveau de stock limité (${risky.slice(0, 3).map((r) => r.reference).join(", ")}).`, reco: "Lancer un réapprovisionnement prioritaire." });
  const coms = COMMERCIALS.map((c) => ({ c, e: evo(sum(sales.filter((s) => s.commercial === c).map((s) => s.amount)), sum(prevSales.filter((s) => s.commercial === c).map((s) => s.amount))) })).filter((x) => x.e !== null).sort((a, b) => b.e! - a.e!);
  if (coms[0]) out.push({ cat: "Commercial", sev: "Moyenne", kpi: "CA par commercial", text: `${coms[0].c} affiche une progression de ${Math.round(coms[0].e!)} % par rapport à la période précédente.`, reco: "Partager ses bonnes pratiques avec l'équipe." });
  const st = stats([], offers);
  if (offers.length) out.push({ cat: "Offres", sev: st.pending > st.won ? "Élevée" : "Info", kpi: "Pipeline", text: `${st.pending} offres sont en attente pour une valeur de ${fmtK(st.pipeline)}.`, reco: "Planifier des relances sur les offres de plus de 15 jours." });
  return out;
}

function InsightsList({ sales, prevSales, offers, compact }: { sales: SaleRecord[]; prevSales: SaleRecord[]; offers: Offer[]; compact?: boolean }) {
  const list = buildInsights(sales, prevSales, offers);
  return (
    <Panel title="Insights IA" subtitle="Insights générés par IA — données de démonstration" action={<StatusPill tone="red"><Sparkles className="mr-1 size-3" /> Démo IA</StatusPill>}>
      {list.length === 0 ? <Empty /> : (
        <ul className={cn("grid gap-3", !compact && "md:grid-cols-2")}>
          {(compact ? list.slice(0, 3) : list).map((i) => (
            <li key={i.text} className="rounded-lg border border-border bg-background/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone="grey">{i.cat}</StatusPill>
                <StatusPill tone={i.sev === "Élevée" ? "red" : i.sev === "Moyenne" ? "amber" : "green"}>{i.sev}</StatusPill>
                {!compact && <span className="ml-auto text-[11px] text-muted-foreground">{TODAY.toLocaleDateString("fr-FR")}</span>}
              </div>
              <p className="mt-2 text-sm font-medium">{i.text}</p>
              {!compact && <p className="mt-2 text-xs text-muted-foreground"><b>KPI :</b> {i.kpi} · <b>Recommandation :</b> {i.reco}</p>}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ---------- Report ---------- */
type St = ReturnType<typeof stats>;
function Report({ f, cur, prev, sales, prevSales, offers }: { f: Filters; cur: St; prev: St | null; sales: SaleRecord[]; prevSales: SaleRecord[]; offers: Offer[] }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [exporting, setExporting] = useState(false);
  const periodLabel = PERIODS.find(([v]) => v === f.period)![1];
  const topCom = groupSum(sales, (s) => s.commercial, (s) => s.amount)[0];
  const topProd = groupSum(sales, (s) => s.reference, (s) => s.amount)[0];
  const topRef = groupSum([...sales, ...offers], (s) => s.reference, () => 1)[0];
  const lowStock = PRODUCTS.filter((p) => ["Rupture", "Stock faible"].includes(stockStatus(p)));
  const insights = buildInsights(sales, prevSales, offers);
  const ev = prev ? evo(cur.ca, prev.ca) : null;

  const sections: [string, string][] = [
    ["Résumé exécutif", `Sur la période « ${periodLabel} », Rousseau Distribution réalise un chiffre d'affaires de ${fmtMAD(cur.ca)}${ev !== null ? ` (${ev >= 0 ? "+" : ""}${ev.toFixed(1)} % vs période précédente)` : ""}, pour ${cur.orders} commandes et un panier moyen de ${fmtMAD(cur.basket)}.`],
    ["Analyse des ventes", `${cur.lines} lignes de vente et ${cur.qty.toLocaleString("fr-FR")} articles vendus. ${cur.refs} références distinctes ont été demandées.`],
    ["Analyse commerciale", topCom ? `${topCom.name} est le premier contributeur avec ${fmtMAD(topCom.value)} de chiffre d'affaires.` : "Aucune donnée commerciale pour ces filtres."],
    ["Analyse produits", topProd ? `Le produit le plus vendu est ${topProd.name} (${fmtMAD(topProd.value)}).` : "Aucun produit vendu pour ces filtres."],
    ["Analyse de la demande", topRef ? `La référence la plus demandée est ${topRef.name} avec ${topRef.value} demandes.` : "Aucune demande pour ces filtres."],
    ["Analyse du stock", `${lowStock.length} références sont en stock faible ou en rupture : ${lowStock.map((p) => p.reference).join(", ")}.`],
    ["Analyse des offres", `${offers.length} offres émises : ${cur.won} gagnées, ${cur.pending} en attente (${fmtMAD(cur.pipeline)}), ${cur.lost} perdues. Taux de conversion ${cur.conv.toFixed(1)} %.`],
    ["Insights clés", insights.map((i) => `• ${i.text}`).join("\n")],
    ["Conclusion", "L'activité reste soutenue. Priorités recommandées : sécuriser le stock des références à forte demande, relancer les offres en attente et capitaliser sur les secteurs porteurs."],
  ];

  const exportPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      doc.setFillColor(196, 30, 36);
      doc.rect(0, 0, 210, 4, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("ROUSSEAU", 15, 20);
      doc.setFillColor(196, 30, 36);
      doc.rect(15, 22, 42, 1.2, "F");
      doc.setFontSize(8);
      doc.text("DISTRIBUTION", 15, 27);
      doc.setFontSize(15);
      doc.text("Rapport IA — Analyse & Reporting", 15, 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(110);
      doc.text(`Période : ${periodLabel} — généré le ${TODAY.toLocaleDateString("fr-FR")} — données de démonstration`, 15, 48);
      doc.setTextColor(20);
      let y = 60;
      sections.forEach(([t, body]) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(196, 30, 36);
        doc.text(t, 15, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(30);
        const lines = doc.splitTextToSize(body.replace(/\u202f|\u00a0/g, " "), 180);
        doc.text(lines, 15, y);
        y += lines.length * 5 + 6;
      });
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.text("Rapport généré par IA à partir de données de démonstration — Rousseau Distribution", 15, 290);
      doc.save(`rapport-ia-rousseau-${f.period}j.pdf`);
      toast.success("Rapport PDF téléchargé");
    } catch {
      toast.error("L'export PDF a échoué. Réessayez.");
    } finally {
      setExporting(false);
    }
  };

  if (state === "idle")
    return (
      <div className="relative overflow-hidden rounded-2xl p-10 text-center panel">
        <Sparkles className="mx-auto size-10 text-primary" />
        <h2 className="mt-4 text-2xl font-extrabold">Rapport analytique IA</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Synthèse complète (ventes, commerciaux, produits, demande, stock, offres) basée sur les filtres actifs — {periodLabel.toLowerCase()}.</p>
        <Button size="lg" className="mt-6" onClick={() => { setState("loading"); setTimeout(() => setState("done"), 1800); }}>
          <Sparkles className="size-4" /> Générer un rapport IA
        </Button>
      </div>
    );
  if (state === "loading")
    return (
      <div className="rounded-2xl p-10 text-center panel">
        <Loader2 className="mx-auto size-10 animate-spin text-primary" />
        <p className="mt-4 font-display font-bold">Génération du rapport en cours…</p>
        <p className="text-sm text-muted-foreground">Analyse des KPIs, des tendances et des insights.</p>
      </div>
    );
  return (
    <div className="space-y-4 animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">Rapport IA — {periodLabel}</h2>
          <p className="text-xs text-muted-foreground">Rapport généré par IA sur données de démonstration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setState("loading"); setTimeout(() => setState("done"), 1200); }}><RefreshCw className="size-4" /> Régénérer</Button>
          <Button onClick={exportPDF} disabled={exporting}>{exporting ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />} Exporter en PDF</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(([t, b], i) => (
          <Panel key={t} className={cn(i === 0 && "md:col-span-2 border-l-4 border-l-primary")}>
            <p className="text-kicker">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="mt-1 font-display text-lg font-bold">{t}</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{b}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
