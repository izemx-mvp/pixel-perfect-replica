// Single seeded dataset shared by Dashboard and Rapports & Analyse.
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = rng(2026);
const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)]!;
const int = (a: number, b: number) => Math.floor(a + r() * (b - a + 1));

export const TODAY = new Date("2026-09-29T12:00:00");
const DAY = 86400000;
const daysAgo = (d: number, h = 9) => new Date(TODAY.getTime() - d * DAY + (h - 12) * 3600000).toISOString();

export const REPS = [
  { id: "r1", name: "Karim Tazi", short: "Karim", zone: "Casablanca-Settat" },
  { id: "r2", name: "Youssef El Amrani", short: "Youssef", zone: "Rabat-Salé" },
  { id: "r3", name: "Salma Benjelloun", short: "Salma", zone: "Fès-Meknès" },
  { id: "r4", name: "Nadia Alaoui", short: "Nadia", zone: "Tanger-Tétouan" },
  { id: "r5", name: "Mehdi Berrada", short: "Mehdi", zone: "Marrakech-Safi" },
] as const;
export type Rep = (typeof REPS)[number];

export const SECTORS = ["Agroalimentaire", "Pharmaceutique", "Automobile", "Textile", "Cimenterie"] as const;
export const FAMILIES = ["Moteurs", "Courroies", "Transmission mécanique", "Roulements"] as const;

const CLIENT_NAMES: [string, (typeof SECTORS)[number], string][] = [
  ["Centrale Laitière Sud", "Agroalimentaire", "Casablanca"], ["Huilerie Atlas", "Agroalimentaire", "Meknès"],
  ["Biscuiterie Al Andalous", "Agroalimentaire", "Fès"], ["Conserves Océan", "Agroalimentaire", "Agadir"],
  ["Sucrerie Doukkala", "Agroalimentaire", "El Jadida"], ["Pharma Maghreb", "Pharmaceutique", "Casablanca"],
  ["Laboratoires Ibn Sina", "Pharmaceutique", "Rabat"], ["Galenica Nord", "Pharmaceutique", "Tanger"],
  ["Bio Pharm Atlas", "Pharmaceutique", "Marrakech"], ["Medilab Industries", "Pharmaceutique", "Casablanca"],
  ["AutoParts Tanger Med", "Automobile", "Tanger"], ["Câblage Kénitra", "Automobile", "Kénitra"],
  ["Emboutissage Atlantique", "Automobile", "Casablanca"], ["Sièges Auto Nord", "Automobile", "Tanger"],
  ["Plastiques Moteur SA", "Automobile", "Kénitra"], ["Filature Fès", "Textile", "Fès"],
  ["Tissage Moderne", "Textile", "Casablanca"], ["Denim Atlas", "Textile", "Tanger"],
  ["Teinturerie Oriental", "Textile", "Oujda"], ["Confection Rabat", "Textile", "Rabat"],
  ["Ciments du Sud", "Cimenterie", "Marrakech"], ["Cimenterie Atlas Nord", "Cimenterie", "Tétouan"],
  ["Granulats Chaouia", "Cimenterie", "Settat"], ["Béton Industriel Maroc", "Cimenterie", "Casablanca"],
  ["Carrières Meknès", "Cimenterie", "Meknès"],
];
const CONTACTS = ["M. Bennani", "Mme Idrissi", "M. Chraibi", "Mme Lahlou", "M. Fassi", "M. Ouazzani", "Mme Kettani", "M. Sqalli"];
export const CLIENTS = CLIENT_NAMES.map(([name, sector, city], i) => ({
  id: `c${i + 1}`, name, sector, city, repId: REPS[i % 5]!.id, contact: CONTACTS[i % CONTACTS.length]!,
}));
export type Client = (typeof CLIENTS)[number];

const REF_SEED: [string, string, (typeof FAMILIES)[number], number][] = [
  ["MOT-ABB-1.5KW", "Moteur ABB 1,5 kW IE3", "Moteurs", 3200], ["MOT-ABB-4KW", "Moteur ABB 4 kW IE3", "Moteurs", 6100],
  ["MOT-SIE-7.5KW", "Moteur Siemens 7,5 kW", "Moteurs", 9800], ["MOT-LS-11KW", "Moteur Leroy-Somer 11 kW", "Moteurs", 13400],
  ["MOT-WEG-2.2KW", "Moteur WEG 2,2 kW", "Moteurs", 3900], ["MOT-RED-40", "Motoréducteur 40 Nm", "Moteurs", 7200],
  ["MOT-FRE-0.75", "Moteur frein 0,75 kW", "Moteurs", 4100], ["MOT-VAR-3KW", "Variateur 3 kW", "Moteurs", 5600],
  ["MOT-VENT-160", "Ventilateur moteur 160", "Moteurs", 420], ["MOT-BRIDE-B5", "Bride moteur B5", "Moteurs", 380],
  ["COU-SPA-1250", "Courroie SPA 1250", "Courroies", 95], ["COU-SPB-2000", "Courroie SPB 2000", "Courroies", 160],
  ["COU-HTD-8M", "Courroie HTD 8M-1200", "Courroies", 480], ["COU-XPZ-900", "Courroie XPZ 900", "Courroies", 85],
  ["COU-A-42", "Courroie trapézoïdale A42", "Courroies", 60], ["COU-T10-1010", "Courroie T10 1010", "Courroies", 310],
  ["COU-POLYV-8PK", "Courroie Poly-V 8PK", "Courroies", 140], ["COU-SPC-3150", "Courroie SPC 3150", "Courroies", 420],
  ["COU-VAR-47", "Courroie variateur 47x13", "Courroies", 350], ["COU-KIT-MAINT", "Kit courroies maintenance", "Courroies", 980],
  ["TRA-POU-SPB250", "Poulie SPB 250", "Transmission mécanique", 890], ["TRA-ACC-ROTEX", "Accouplement Rotex 38", "Transmission mécanique", 760],
  ["TRA-CHA-08B", "Chaîne 08B-1 (5 m)", "Transmission mécanique", 540], ["TRA-PIG-Z19", "Pignon 08B Z19", "Transmission mécanique", 180],
  ["TRA-MOY-TL", "Moyeu Taper-Lock 2012", "Transmission mécanique", 150], ["TRA-REDU-60", "Réducteur roue et vis 60", "Transmission mécanique", 4200],
  ["TRA-CARD-40", "Cardan 40 mm", "Transmission mécanique", 1300], ["TRA-TEND-01", "Tendeur de courroie", "Transmission mécanique", 620],
  ["TRA-EMB-10", "Embrayage électromagnétique", "Transmission mécanique", 2900], ["TRA-CREM-M2", "Crémaillère M2 1 m", "Transmission mécanique", 690],
  ["ROU-6205-2RS", "Roulement SKF 6205-2RS", "Roulements", 85], ["ROU-6308-ZZ", "Roulement SKF 6308-ZZ", "Roulements", 240],
  ["ROU-22220-E", "Roulement rotule 22220 E", "Roulements", 2100], ["ROU-NU210", "Roulement rouleaux NU210", "Roulements", 620],
  ["ROU-SY40-TF", "Palier SKF SY 40 TF", "Roulements", 450], ["ROU-UCP-208", "Palier UCP 208", "Roulements", 310],
  ["ROU-32210", "Roulement conique 32210", "Roulements", 390], ["ROU-7206-BEP", "Roulement contact oblique 7206", "Roulements", 520],
  ["ROU-6004-2Z", "Roulement 6004-2Z", "Roulements", 45], ["ROU-51110", "Butée à billes 51110", "Roulements", 160],
];
export const REFS = REF_SEED.map(([code, label, family, price], i) => ({
  code, label, family, price, stock: i % 7 === 0 ? 0 : i % 5 === 0 ? int(1, 4) : int(8, 120), min: int(5, 15),
}));
export type Ref = (typeof REFS)[number];

export type OfferStatus = "Conclue" | "En attente" | "Perdue";
export type VisitResult = "Offre émise" | "Commande" | "À relancer" | "Sans suite";
export type Line = { ref: string; qty: number };
export type Visit = {
  id: string; date: string; repId: string; clientId: string; contact: string; purpose: string;
  requested: Line[]; offerId: string | null; result: VisitResult; nextAction: string; notes: string;
};
export type Offer = { id: string; date: string; repId: string; clientId: string; visitId: string; lines: Line[]; amount: number; status: OfferStatus; lastContact: string };

const PURPOSES = ["Suivi maintenance préventive", "Arrêt machine — dépannage", "Présentation nouvelle gamme", "Renouvellement stock atelier", "Audit transmission ligne", "Négociation contrat annuel"];
const NEXT = ["Relancer l'offre sous 7 jours", "Envoyer fiche technique", "Planifier une démonstration", "Confirmer délai de livraison", "Visite de suivi le mois prochain", "Aucune action"];

// Popular refs to make "demandé par plusieurs clients" meaningful
const HOT = [30, 10, 0, 20, 11, 34, 2, 21];
export const VISITS: Visit[] = [];
export const OFFERS: Offer[] = [];
for (let i = 0; i < 60; i++) {
  const client = CLIENTS[int(0, 24)]!;
  const repId = r() < 0.8 ? client.repId : pick(REPS).id;
  const d = int(0, 175);
  const nLines = int(1, 3);
  const requested: Line[] = [];
  for (let k = 0; k < nLines; k++) {
    const ref = (r() < 0.55 ? REFS[pick(HOT)]! : pick(REFS)).code;
    if (!requested.some((l) => l.ref === ref)) requested.push({ ref, qty: int(1, 12) });
  }
  const id = `VIS-${String(1001 + i)}`;
  let offerId: string | null = null;
  let result: VisitResult = r() < 0.5 ? "À relancer" : "Sans suite";
  if (OFFERS.length < 40 && r() < 0.75) {
    offerId = `OF-2026-${3100 + OFFERS.length}`;
    const amount = requested.reduce((s, l) => s + (REFS.find((x) => x.code === l.ref)!.price * l.qty), 0);
    const status: OfferStatus = d < 25 ? (r() < 0.75 ? "En attente" : "Conclue") : r() < 0.55 ? "Conclue" : r() < 0.5 ? "En attente" : "Perdue";
    OFFERS.push({ id: offerId, date: daysAgo(d), repId, clientId: client.id, visitId: id, lines: requested, amount: Math.round(amount), status, lastContact: daysAgo(Math.max(0, d - int(0, 10))) });
    result = status === "Conclue" ? "Commande" : "Offre émise";
  }
  VISITS.push({
    id, date: daysAgo(d, int(8, 17)), repId, clientId: client.id, contact: client.contact, purpose: pick(PURPOSES),
    requested, offerId, result, nextAction: result === "Commande" ? "Confirmer délai de livraison" : pick(NEXT),
    notes: `Échange avec ${client.contact}. Besoin exprimé sur ${requested.length} référence(s). ${result === "Sans suite" ? "Pas de budget immédiat." : "Client intéressé, suivi à assurer."}`,
  });
}
VISITS.sort((a, b) => b.date.localeCompare(a.date));

export type Sale = { id: string; date: string; repId: string; clientId: string; ref: string; qty: number; amount: number };
export const SALES: Sale[] = [];
OFFERS.filter((o) => o.status === "Conclue").forEach((o) =>
  o.lines.forEach((l) => SALES.push({ id: `VT-${SALES.length + 1}`, date: o.date, repId: o.repId, clientId: o.clientId, ref: l.ref, qty: l.qty, amount: REFS.find((x) => x.code === l.ref)!.price * l.qty })),
);
for (let i = 0; i < 260; i++) {
  const c = CLIENTS[int(0, 24)]!;
  const ref = (r() < 0.5 ? REFS[pick(HOT)]! : pick(REFS));
  const qty = int(1, 10);
  const d = Math.floor(Math.pow(r(), 0.85) * 364);
  SALES.push({ id: `VT-${SALES.length + 1}`, date: daysAgo(d), repId: r() < 0.8 ? c.repId : pick(REPS).id, clientId: c.id, ref: ref.code, qty, amount: ref.price * qty });
}

export const repName = (id: string) => REPS.find((x) => x.id === id)?.name ?? id;
export const clientOf = (id: string) => CLIENTS.find((x) => x.id === id)!;
export const refOf = (code: string) => REFS.find((x) => x.code === code)!;
export const fmtMAD = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} MAD`;
export const fmtK = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(2).replace(".", ",")} M MAD` : n >= 1000 ? `${Math.round(n / 1000)} k MAD` : fmtMAD(n));
export const fmtDate = (s: string) => new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
export const ageDays = (s: string) => Math.floor((TODAY.getTime() - new Date(s).getTime()) / DAY);
export const ago = (s: string) => {
  const m = Math.floor((TODAY.getTime() - new Date(s).getTime()) / 60000);
  if (m < 60) return `il y a ${Math.max(1, m)} min`;
  if (m < 1440) return `il y a ${Math.floor(m / 60)} h`;
  return `il y a ${Math.floor(m / 1440)} j`;
};

export type Filters = { period: number; rep: string; sector: string };
export const DEFAULT_FILTERS: Filters = { period: 90, rep: "all", sector: "all" };
const inWindow = (date: string, f: Filters, shift = 0) => {
  const a = ageDays(date) - shift;
  return a >= 0 && a < f.period;
};
const okClient = (clientId: string, f: Filters) => f.sector === "all" || clientOf(clientId).sector === f.sector;
const okRep = (repId: string, f: Filters) => f.rep === "all" || repId === f.rep;
export function scoped(f: Filters, shift = 0) {
  const p = (x: { date: string; repId: string; clientId: string }) => inWindow(x.date, f, shift) && okRep(x.repId, f) && okClient(x.clientId, f);
  return { sales: SALES.filter(p), visits: VISITS.filter(p), offers: OFFERS.filter(p) };
}
export const sum = (a: { amount: number }[]) => a.reduce((s, x) => s + x.amount, 0);
export function convRate(offers: Offer[]) {
  const closed = offers.filter((o) => o.status !== "En attente");
  return closed.length ? (offers.filter((o) => o.status === "Conclue").length / closed.length) * 100 : 0;
}
export function groupSum<T>(rows: T[], key: (t: T) => string, val: (t: T) => number) {
  const m = new Map<string, number>();
  rows.forEach((x) => m.set(key(x), (m.get(key(x)) ?? 0) + val(x)));
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
/** Clients distincts ayant demandé une référence (visites) */
export function requesters(code: string, visits: Visit[] = VISITS) {
  return [...new Set(visits.filter((v) => v.requested.some((l) => l.ref === code)).map((v) => v.clientId))];
}
export function salesSeries(sales: Sale[], period: number) {
  const step = period <= 30 ? 1 : period <= 90 ? 7 : 30;
  const buckets = Math.ceil(period / step);
  const out = Array.from({ length: buckets }, (_, i) => {
    const d = new Date(TODAY.getTime() - (buckets - 1 - i) * step * DAY);
    return { name: d.toLocaleDateString("fr-FR", step === 30 ? { month: "short" } : { day: "2-digit", month: "short" }), value: 0 };
  });
  sales.forEach((s) => {
    const b = buckets - 1 - Math.floor(ageDays(s.date) / step);
    if (out[b]) out[b]!.value += s.amount;
  });
  return out;
}
export function lastReportDays(repId: string) {
  const v = VISITS.find((x) => x.repId === repId);
  return v ? ageDays(v.date) : 999;
}
export function downloadCSV(name: string, rows: (string | number)[][]) {
  const csv = "\ufeff" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function exportPDF(title: string, subtitle: string, sections: { heading: string; lines?: string[]; table?: { head: string[]; rows: (string | number)[][] } }[], file: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  doc.setFillColor(28, 30, 34); doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
  doc.text("ROUSSEAU DISTRIBUTION", 14, 14);
  doc.setFillColor(200, 32, 38); doc.rect(14, 17, 72, 1.4, "F");
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text("La force de vos machines, notre engagement", 14, 23);
  doc.setTextColor(30, 30, 30); doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text(title, 14, 40);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(110, 110, 110); doc.text(subtitle, 14, 46);
  let y = 56;
  const ensure = (h: number) => { if (y + h > 285) { doc.addPage(); y = 18; } };
  sections.forEach((s) => {
    ensure(12); doc.setTextColor(200, 32, 38); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text(s.heading, 14, y); y += 6;
    doc.setTextColor(40, 40, 40); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    s.lines?.forEach((l) => { const w = doc.splitTextToSize(`• ${l}`, 180); ensure(w.length * 4.5); doc.text(w, 16, y); y += w.length * 4.5; });
    if (s.table) {
      const cw = 182 / s.table.head.length;
      ensure(8); doc.setFillColor(240, 240, 240); doc.rect(14, y - 4, 182, 6, "F"); doc.setFont("helvetica", "bold");
      s.table.head.forEach((h, i) => doc.text(String(h).slice(0, 26), 15 + i * cw, y)); y += 6; doc.setFont("helvetica", "normal");
      s.table.rows.slice(0, 40).forEach((row) => { ensure(5); row.forEach((c, i) => doc.text(String(c).slice(0, 28), 15 + i * cw, y)); y += 5; });
    }
    y += 4;
  });
  doc.setFontSize(7); doc.setTextColor(140, 140, 140); doc.text("Document généré dans l'espace de démonstration — données fictives.", 14, 292);
  doc.save(file);
}
