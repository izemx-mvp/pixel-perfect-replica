/**
 * Shared demo dataset for "Consolidation des Données" and "Analyse & Reporting".
 * Deterministic (seeded) so both interfaces always show coherent numbers.
 */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(2026);
const pick = <T,>(arr: readonly T[], weights?: number[]): T => {
  if (!weights) return arr[Math.floor(rnd() * arr.length)]!;
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rnd() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return arr[i]!;
  }
  return arr[arr.length - 1]!;
};

/** Fixed "today" for the demo so SSR and browser render identically. */
export const TODAY = new Date("2026-09-29T12:00:00");
const DAY = 86400000;

export const COMMERCIALS = [
  "Youssef El Amrani",
  "Salma Benjelloun",
  "Karim Tazi",
  "Nadia Alaoui",
  "Mehdi Berrada",
] as const;
export const SECTORS_BI = [
  "Automobile",
  "Agroalimentaire",
  "Textile",
  "Mines",
  "Manufacturing",
  "Maintenance industrielle",
  "Construction",
  "Agriculture",
  "Énergie",
] as const;
export const REGIONS = ["Casablanca-Settat", "Fès-Meknès", "Rabat-Salé", "Tanger-Tétouan", "Marrakech-Safi", "Souss-Massa"] as const;
export const CATEGORIES = ["Roulements", "Courroies", "Poulies", "Paliers", "Lubrifiants", "Abrasifs", "Outillage"] as const;

export type Product = {
  reference: string;
  name: string;
  category: (typeof CATEGORIES)[number];
  brand: string;
  price: number;
  stock: number;
  minStock: number;
};

export const PRODUCTS: Product[] = [
  { reference: "SKF-6205-2RS", name: "Roulement rigide à billes 6205-2RS", category: "Roulements", brand: "SKF", price: 68, stock: 42, minStock: 80 },
  { reference: "SKF-6308-ZZ", name: "Roulement 6308-ZZ", category: "Roulements", brand: "SKF", price: 185, stock: 130, minStock: 60 },
  { reference: "SKF-22215-EK", name: "Roulement à rotule 22215 EK", category: "Roulements", brand: "SKF", price: 1240, stock: 9, minStock: 15 },
  { reference: "SKF-32210", name: "Roulement à rouleaux coniques 32210", category: "Roulements", brand: "SKF", price: 390, stock: 64, minStock: 40 },
  { reference: "OPT-SPA-1250", name: "Courroie trapézoïdale SPA 1250", category: "Courroies", brand: "Optibelt", price: 96, stock: 18, minStock: 50 },
  { reference: "OPT-XPB-2000", name: "Courroie crantée XPB 2000", category: "Courroies", brand: "Optibelt", price: 164, stock: 75, minStock: 40 },
  { reference: "GAT-HTD-8M", name: "Courroie synchrone HTD 8M-1200", category: "Courroies", brand: "Gates", price: 420, stock: 0, minStock: 12 },
  { reference: "POU-SPB-250", name: "Poulie SPB 250 x 3 gorges", category: "Poulies", brand: "Rousseau", price: 780, stock: 22, minStock: 10 },
  { reference: "POU-TL-2012", name: "Moyeu amovible Taper Lock 2012", category: "Poulies", brand: "Rousseau", price: 145, stock: 210, minStock: 40 },
  { reference: "SKF-SY-40-TF", name: "Palier à semelle SY 40 TF", category: "Paliers", brand: "SKF", price: 520, stock: 31, minStock: 25 },
  { reference: "SKF-FYJ-30", name: "Palier applique FYJ 30 TF", category: "Paliers", brand: "SKF", price: 410, stock: 6, minStock: 20 },
  { reference: "LOX-8270", name: "Loxeal 82-70 frein filet fort", category: "Lubrifiants", brand: "Loxeal", price: 118, stock: 340, minStock: 60 },
  { reference: "SKF-LGMT2-1", name: "Graisse SKF LGMT 2 — 1 kg", category: "Lubrifiants", brand: "SKF", price: 265, stock: 58, minStock: 50 },
  { reference: "NOR-DISC-125", name: "Disque à tronçonner Norton 125 mm", category: "Abrasifs", brand: "Norton", price: 14, stock: 1850, minStock: 400 },
  { reference: "NOR-FLAP-P80", name: "Disque à lamelles Norton P80", category: "Abrasifs", brand: "Norton", price: 32, stock: 96, minStock: 300 },
  { reference: "OUT-EXT-TMMA", name: "Extracteur SKF TMMA 60", category: "Outillage", brand: "SKF", price: 3450, stock: 4, minStock: 3 },
  { reference: "OUT-CLE-SET", name: "Coffret clés à ergot", category: "Outillage", brand: "Rousseau", price: 890, stock: 48, minStock: 8 },
];
const PRODUCT_WEIGHTS = [14, 7, 4, 6, 11, 6, 4, 4, 6, 5, 5, 6, 6, 9, 6, 2, 2];

const CLIENTS = [
  ["Atlas Industrie", "Casablanca-Settat", "Automobile"],
  ["Renault Tanger Fournisseurs", "Tanger-Tétouan", "Automobile"],
  ["Cosumar Maintenance", "Casablanca-Settat", "Agroalimentaire"],
  ["Les Domaines Agricoles", "Fès-Meknès", "Agriculture"],
  ["Managem Services", "Marrakech-Safi", "Mines"],
  ["OCP Maintenance Khouribga", "Casablanca-Settat", "Mines"],
  ["Textiles du Nord", "Tanger-Tétouan", "Textile"],
  ["Ciments de l'Atlas", "Fès-Meknès", "Construction"],
  ["Lesieur Cristal Usine", "Casablanca-Settat", "Agroalimentaire"],
  ["Meknès Mécanique", "Fès-Meknès", "Maintenance industrielle"],
  ["Sud Énergie Solaire", "Souss-Massa", "Énergie"],
  ["Rabat Manufacturing", "Rabat-Salé", "Manufacturing"],
  ["Centrale Laitière Process", "Casablanca-Settat", "Agroalimentaire"],
  ["Agadir Pêche Industrie", "Souss-Massa", "Agroalimentaire"],
  ["Tanger Auto Parts", "Tanger-Tétouan", "Automobile"],
  ["Safi Chimie Maintenance", "Marrakech-Safi", "Maintenance industrielle"],
  ["BTP Rabat Engineering", "Rabat-Salé", "Construction"],
  ["Fès Textile Group", "Fès-Meknès", "Textile"],
] as const;

export const SOURCES = ["Sage", "Excel", "Email"] as const;
export type Source = (typeof SOURCES)[number];

export type SaleRecord = {
  id: string;
  date: string;
  client: string;
  company: string;
  commercial: string;
  sector: string;
  region: string;
  category: string;
  product: string;
  reference: string;
  quantity: number;
  amount: number;
  source: Source;
  quality: "Validé" | "Corrigé" | "À vérifier";
};

export type OfferStatus = "Gagnée" | "En attente" | "Perdue";
export type Offer = {
  id: string;
  date: string;
  client: string;
  commercial: string;
  sector: string;
  region: string;
  category: string;
  product: string;
  reference: string;
  quantity: number;
  amount: number;
  status: OfferStatus;
  source: Source;
};

const CONTACTS = ["M. Idrissi", "Mme Chraibi", "M. Fassi", "Mme Lahlou", "M. Bennani", "Mme Ziani", "M. Kettani"];

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const SALES: SaleRecord[] = [];
for (let i = 0; i < 720; i++) {
  // growing activity over the last 365 days
  const daysAgo = Math.floor(Math.pow(rnd(), 1.15) * 365);
  const d = new Date(TODAY.getTime() - daysAgo * DAY);
  const c = pick(CLIENTS);
  const p = pick(PRODUCTS, PRODUCT_WEIGHTS);
  const qty = Math.max(1, Math.round((p.price > 1000 ? 2 : p.price > 300 ? 8 : p.price > 50 ? 24 : 120) * (0.4 + rnd() * 1.4)));
  const comIdx = (CLIENTS.indexOf(c) + (rnd() < 0.2 ? 1 : 0)) % COMMERCIALS.length;
  SALES.push({
    id: `VT-${String(10000 + i)}`,
    date: iso(d),
    client: pick(CONTACTS),
    company: c[0],
    commercial: COMMERCIALS[comIdx]!,
    sector: c[2],
    region: c[1],
    category: p.category,
    product: p.name,
    reference: p.reference,
    quantity: qty,
    amount: Math.round(qty * p.price * (0.92 + rnd() * 0.12)),
    source: pick(SOURCES, [62, 26, 12]),
    quality: pick(["Validé", "Corrigé", "À vérifier"] as const, [90, 8, 2]),
  });
}
SALES.sort((a, b) => b.date.localeCompare(a.date));

export const OFFERS: Offer[] = [];
for (let i = 0; i < 240; i++) {
  const daysAgo = Math.floor(Math.pow(rnd(), 1.1) * 365);
  const d = new Date(TODAY.getTime() - daysAgo * DAY);
  const c = pick(CLIENTS);
  const p = pick(PRODUCTS, PRODUCT_WEIGHTS);
  const qty = Math.max(1, Math.round((p.price > 1000 ? 3 : p.price > 300 ? 12 : p.price > 50 ? 40 : 200) * (0.5 + rnd() * 1.5)));
  const status: OfferStatus = daysAgo < 30 ? pick(["Gagnée", "En attente", "Perdue"] as const, [25, 60, 15]) : pick(["Gagnée", "En attente", "Perdue"] as const, [52, 14, 34]);
  OFFERS.push({
    id: `OF-2026-${String(3000 + i)}`,
    date: iso(d),
    client: c[0],
    commercial: COMMERCIALS[CLIENTS.indexOf(c) % COMMERCIALS.length]!,
    sector: c[2],
    region: c[1],
    category: p.category,
    product: p.name,
    reference: p.reference,
    quantity: qty,
    amount: Math.round(qty * p.price),
    status,
    source: pick(SOURCES, [30, 30, 40]),
  });
}
OFFERS.sort((a, b) => b.date.localeCompare(a.date));

export const EMAILS = [
  { id: "em1", subject: "Demande de prix — Roulement 6205 SKF", from: "achats@atlas-industrie.ma", client: "Atlas Industrie", quantity: 24, sector: "Automobile", reference: "SKF-6205-2RS", date: "2026-09-28", detected: ["Offre", "Référence", "Client"] },
  { id: "em2", subject: "Urgent : courroies SPA 1250 x 40", from: "maintenance@cosumar.ma", client: "Cosumar Maintenance", quantity: 40, sector: "Agroalimentaire", reference: "OPT-SPA-1250", date: "2026-09-27", detected: ["Offre", "Référence", "Quantité"] },
  { id: "em3", subject: "Relance devis paliers SY 40 TF", from: "t.fassi@managem.ma", client: "Managem Services", quantity: 12, sector: "Mines", reference: "SKF-SY-40-TF", date: "2026-09-26", detected: ["Relance", "Référence"] },
  { id: "em4", subject: "Commande confirmée — disques Norton", from: "achat@ciments-atlas.ma", client: "Ciments de l'Atlas", quantity: 500, sector: "Construction", reference: "NOR-DISC-125", date: "2026-09-25", detected: ["Commande", "Référence", "Client"] },
  { id: "em5", subject: "Besoin graisse LGMT 2 pour arrêt technique", from: "atelier@meknes-meca.ma", client: "Meknès Mécanique", quantity: 30, sector: "Maintenance industrielle", reference: "SKF-LGMT2-1", date: "2026-09-24", detected: ["Offre", "Quantité"] },
];

export const EXCEL_FILES = [
  { name: "Ventes_Janvier_2026.xlsx", date: "2026-09-22", rows: 412, cols: 14, extracted: 406, status: "Traité", quality: 98.5 },
  { name: "Stock_Casablanca.xlsx", date: "2026-09-26", rows: 286, cols: 9, extracted: 286, status: "Traité", quality: 99.2 },
  { name: "Offres_Commerciales.xlsx", date: "2026-09-27", rows: 198, cols: 12, extracted: 189, status: "Traité", quality: 95.4 },
  { name: "Demandes_Clients.xlsx", date: "2026-09-28", rows: 154, cols: 11, extracted: 141, status: "En révision", quality: 91.6 },
];

export type ReviewIssue = {
  id: string;
  issue: string;
  record: string;
  field: string;
  value: string;
  source: Source;
  status: "À vérifier" | "Corrigé" | "Validé" | "Ignoré";
};

export const REVIEW_ITEMS: ReviewIssue[] = [
  { id: "rv1", issue: "Référence produit manquante", record: "Demandes_Clients.xlsx — ligne 38", field: "Référence", value: "", source: "Excel", status: "À vérifier" },
  { id: "rv2", issue: "Client inconnu", record: "Email du 27/09 — « STE MAGHREB MECA »", field: "Client", value: "STE MAGHREB MECA", source: "Email", status: "À vérifier" },
  { id: "rv3", issue: "Quantité invalide", record: "Offres_Commerciales.xlsx — ligne 112", field: "Quantité", value: "-4", source: "Excel", status: "À vérifier" },
  { id: "rv4", issue: "Doublon détecté", record: "VT-10214 / VT-10233 — Atlas Industrie", field: "Identifiant", value: "VT-10233", source: "Sage", status: "À vérifier" },
  { id: "rv5", issue: "Commercial manquant", record: "Email du 25/09 — Ciments de l'Atlas", field: "Commercial", value: "", source: "Email", status: "À vérifier" },
  { id: "rv6", issue: "Nom client incohérent", record: "« Cosumar » vs « COSUMAR SA »", field: "Client", value: "COSUMAR SA", source: "Excel", status: "À vérifier" },
  { id: "rv7", issue: "Email invalide", record: "Demandes_Clients.xlsx — ligne 91", field: "Email", value: "achat@@textiles-nord", source: "Excel", status: "À vérifier" },
  { id: "rv8", issue: "Doublon détecté", record: "OF-2026-3041 / OF-2026-3059", field: "Identifiant", value: "OF-2026-3059", source: "Email", status: "À vérifier" },
  { id: "rv9", issue: "Information produit manquante", record: "Email du 24/09 — Meknès Mécanique", field: "Produit", value: "", source: "Email", status: "À vérifier" },
  { id: "rv10", issue: "Référence invalide", record: "Ventes_Janvier_2026.xlsx — ligne 204", field: "Référence", value: "SKF-62O5", source: "Excel", status: "À vérifier" },
  { id: "rv11", issue: "Quantité manquante", record: "Email du 26/09 — Managem Services", field: "Quantité", value: "", source: "Email", status: "À vérifier" },
];

export const MAD = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
export const fmtMAD = (n: number) => `${MAD.format(Math.round(n))} MAD`;
export const fmtK = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2).replace(".", ",")} M MAD` : n >= 1000 ? `${Math.round(n / 1000)} k MAD` : `${Math.round(n)} MAD`;
export const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
export const daysBetween = (d: string) => Math.round((TODAY.getTime() - new Date(d + "T12:00:00").getTime()) / DAY);

export function downloadCSV(filename: string, rows: Record<string, string | number>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]!);
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [headers.join(";"), ...rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(";"))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function stockStatus(p: { stock: number; minStock: number }) {
  if (p.stock === 0) return "Rupture" as const;
  if (p.stock < p.minStock) return "Stock faible" as const;
  if (p.stock > p.minStock * 4) return "Surstock" as const;
  return "Disponible" as const;
}

/** Shared chart palette pulled from design tokens. */
export const CHART_COLORS = [
  "var(--primary)",
  "var(--graphite)",
  "var(--steel)",
  "oklch(0.68 0.15 35)",
  "oklch(0.45 0.04 250)",
  "oklch(0.78 0.03 250)",
  "oklch(0.38 0.14 25)",
  "oklch(0.6 0.02 90)",
  "oklch(0.55 0.08 230)",
];
