import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Clock, MessageCircle, Send, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { InterfaceHeader, Panel, chartTooltipStyle } from "@/components/bi";
import { Button } from "@/components/ui/button";
import { OFFERS, REFS, REPS, VISITS, ago, ageDays, clientOf, convRate, fmtK, fmtMAD, groupSum, lastReportDays, repName, requesters, salesSeries, scoped, sum } from "@/data/rapports";
import { SEED_LEADS, loadLeads, type Lead } from "@/lib/leads";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Rousseau Distribution" },
      { name: "description", content: "Tableau de bord Rousseau Distribution : ventes, visites, offres, alertes et contacts WhatsApp." },
      { property: "og:title", content: "Dashboard — Rousseau Distribution" },
      { property: "og:description", content: "Vue d'ensemble de l'activité commerciale et des demandes clients." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AppShell><Dashboard /></AppShell>,
});

const COLORS = ["var(--primary)", "#6b7280", "#9ca3af", "#374151", "#d1d5db"];
function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>(SEED_LEADS);
  useEffect(() => setLeads(loadLeads()), []);
  const f = { period: 90, rep: "all", sector: "all" };
  const cur = scoped(f), prev = scoped(f, 90);
  const pending = cur.offers.filter((o) => o.status === "En attente");
  const hot = REFS.filter((r) => r.stock <= r.min && requesters(r.code).length >= 3);
  const silent = REPS.filter((r) => lastReportDays(r.id) >= 5);
  const stale = OFFERS.filter((o) => o.status === "En attente" && ageDays(o.lastContact) > 15);
  const newLeads = leads.filter((l) => l.stage === "Nouveau contact");
  const K = ({ label, value, sub, to, search }: { label: string; value: string; sub: string; to: "/rapports" | "/qualification"; search?: { vue: string } }) => (
    <Link to={to} search={search as never} className="panel hover-lift block rounded-xl p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-extrabold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </Link>
  );
  return (
    <div className="space-y-5">
      <InterfaceHeader num="01" kicker="Dashboard" title="Vue d'ensemble" subtitle="Activité des 90 derniers jours : ventes, visites, offres, alertes et nouveaux contacts WhatsApp." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {K({ label: "Chiffre d'affaires", value: fmtK(sum(cur.sales)), sub: `Préc. ${fmtK(sum(prev.sales))}`, to: "/rapports", search: { vue: "ventes" } })}
        {K({ label: "Visites", value: String(cur.visits.length), sub: `Préc. ${prev.visits.length}`, to: "/rapports", search: { vue: "visites" } })}
        {K({ label: "Offres en cours", value: String(pending.length), sub: fmtK(sum(pending)), to: "/rapports", search: { vue: "offres" } })}
        {K({ label: "Taux de conversion", value: `${convRate(cur.offers).toFixed(0)} %`, sub: `Préc. ${convRate(prev.offers).toFixed(0)} %`, to: "/rapports", search: { vue: "offres" } })}
        {K({ label: "Contacts WhatsApp", value: String(newLeads.length), sub: `nouveaux sur ${leads.length}`, to: "/qualification" })}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Évolution des ventes"><div className="h-60"><ResponsiveContainer><LineChart data={salesSeries(cur.sales, 90)}><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} /><Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => fmtMAD(v)} /><Line dataKey="value" stroke="var(--primary)" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div></Panel>
        <Panel title="Ventes par secteur"><div className="h-60"><ResponsiveContainer><PieChart><Pie data={groupSum(cur.sales, (s) => clientOf(s.clientId).sector, (s) => s.amount)} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>{COLORS.map((c) => <Cell key={c} fill={c} />)}</Pie><Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => fmtMAD(v)} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div></Panel>
        <Panel title="Top commerciaux"><div className="h-60"><ResponsiveContainer><BarChart data={groupSum(cur.sales, (s) => repName(s.repId), (s) => s.amount)} layout="vertical"><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} /><Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => fmtMAD(v)} /><Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></Panel>
        <Panel title="Top produits"><div className="h-60"><ResponsiveContainer><BarChart data={groupSum(cur.sales, (s) => s.ref, (s) => s.amount).slice(0, 6)} layout="vertical"><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} /><Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => fmtMAD(v)} /><Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Activité récente">
          <ul className="space-y-3 text-sm">
            {newLeads.slice(0, 2).map((l) => <li key={l.id}><Link to="/qualification" className="flex gap-2 hover:text-primary"><MessageCircle className="mt-0.5 size-4 shrink-0 text-success" /><span>Nouveau contact WhatsApp : <b>{l.nom}</b> — {l.produit} {l.reference}<span className="block text-xs text-muted-foreground">{ago(l.date)}</span></span></Link></li>)}
            {VISITS.slice(0, 5).map((v, i) => <li key={v.id}><Link to="/rapports" search={{ vue: "visites", id: v.id }} className="hover:text-primary">Nouveau rapport de visite reçu de <b>{REPS.find((r) => r.id === v.repId)!.short}</b>, client {clientOf(v.clientId).name}<span className="block text-xs text-muted-foreground">{i === 0 ? "il y a 5 min" : ago(v.date)}</span></Link></li>)}
          </ul>
        </Panel>
        <Panel title="Alertes">
          <ul className="space-y-2 text-sm">
            {hot.slice(0, 4).map((r) => <li key={r.code}><Link to="/rapports" search={{ vue: "produits", id: r.code }} className="flex gap-2 hover:text-primary"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />{r.code} : {requesters(r.code).length} clients demandeurs, stock {r.stock}</Link></li>)}
            {silent.map((r) => <li key={r.id}><Link to="/rapports" search={{ vue: "commerciaux", id: r.id }} className="flex gap-2 hover:text-primary"><Clock className="mt-0.5 size-4 shrink-0 text-warning" />{r.name} : aucun rapport depuis {lastReportDays(r.id)} jours</Link></li>)}
            {stale.slice(0, 3).map((o) => <li key={o.id}><Link to="/rapports" search={{ vue: "offres" }} className="flex gap-2 hover:text-primary"><Send className="mt-0.5 size-4 shrink-0 text-warning" />{o.id} sans réponse depuis {ageDays(o.lastContact)} j</Link></li>)}
          </ul>
        </Panel>
        <Panel title="Actions rapides">
          <div className="grid gap-2">
            <Button asChild><Link to="/rapports" search={{ vue: "ia" }}><Sparkles className="size-4" /> Générer un rapport</Link></Button>
            <Button asChild variant="outline"><Link to="/rapports" search={{ vue: "visites" }}>Dernières visites</Link></Button>
            <Button asChild variant="outline"><Link to="/rapports" search={{ vue: "offres" }}>Offres à relancer ({stale.length})</Link></Button>
            <Button asChild variant="outline"><Link to="/qualification">Voir le pipeline WhatsApp</Link></Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
