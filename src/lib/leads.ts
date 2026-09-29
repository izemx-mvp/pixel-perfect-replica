export const STAGES = ["Nouveau contact", "À qualifier", "Qualifié", "Offre envoyée", "Gagné", "Perdu"] as const;
export type Stage = (typeof STAGES)[number];
export type Lead = {
  id: string; date: string; nom: string; societe: string; telephone: string; ville: string; secteur: string;
  produit: string; reference: string; quantite: string; urgence: string; message: string; notes: string; stage: Stage; score: number;
};
const KEY = "rd_whatsapp_leads";
const L = (id: number, d: string, nom: string, societe: string, telephone: string, ville: string, secteur: string, produit: string, reference: string, quantite: string, urgence: string, message: string, stage: Stage, score: number): Lead =>
  ({ id: `WA-${id}`, date: d, nom, societe, telephone, ville, secteur, produit, reference, quantite, urgence, message, notes: "", stage, score });
export const SEED_LEADS: Lead[] = [
  L(2041, "2026-09-29T11:52:00", "Hamid Rachidi", "Centrale Laitière Sud", "+212 661 23 45 67", "Casablanca", "Agroalimentaire", "Roulement", "SKF 6205-2RS", "20", "Urgente", "Bonjour, on a besoin de 20 roulements 6205-2RS pour la ligne d'embouteillage, c'est urgent, vous avez en stock ?", "Nouveau contact", 82),
  L(2040, "2026-09-29T10:15:00", "Sara Moukrim", "Pharma Maghreb", "+212 662 98 11 04", "Casablanca", "Pharmaceutique", "Moteur", "ABB 4 kW IE3", "2", "Normale", "Salam, je cherche un moteur ABB 4kW pour un mélangeur, pouvez-vous m'envoyer un prix ?", "Nouveau contact", 74),
  L(2039, "2026-09-28T16:40:00", "Omar Filali", "", "+212 670 44 55 12", "Fès", "Textile", "Courroie", "", "", "Faible", "Bonsoir, vous vendez des courroies pour machines à tisser ?", "À qualifier", 38),
  L(2038, "2026-09-28T09:05:00", "Latifa Berrada", "Ciments du Sud", "+212 661 77 80 90", "Marrakech", "Cimenterie", "Roulement", "22220 E", "4", "Critique (arrêt machine)", "Broyeur à l'arrêt, il nous faut 4 roulements rotule 22220 E aujourd'hui si possible.", "Qualifié", 91),
  L(2037, "2026-09-27T14:22:00", "Youness Amrani", "AutoParts Tanger Med", "+212 665 10 20 30", "Tanger", "Automobile", "Transmission", "Accouplement Rotex 38", "10", "Normale", "Besoin de 10 accouplements Rotex 38, quel délai ?", "Offre envoyée", 77),
  L(2036, "2026-09-26T11:00:00", "Imane Tahiri", "Huilerie Atlas", "+212 668 33 21 09", "Meknès", "Agroalimentaire", "Courroie", "SPB 2000", "12", "Normale", "Bonjour, je voudrais 12 courroies SPB 2000.", "Gagné", 85),
  L(2035, "2026-09-25T17:30:00", "Rachid Naciri", "", "+212 677 90 12 34", "Rabat", "Autre", "Autre", "", "", "Faible", "C'est pour un particulier, vous vendez des pièces de vélo ?", "Perdu", 12),
  L(2034, "2026-09-25T08:45:00", "Khadija Ouali", "Denim Atlas", "+212 664 56 78 90", "Tanger", "Textile", "Moteur", "Motoréducteur 40 Nm", "3", "Urgente", "On cherche 3 motoréducteurs 40 Nm, photo de la plaque en pièce jointe.", "À qualifier", 66),
];
export function loadLeads(): Lead[] {
  if (typeof window === "undefined") return SEED_LEADS;
  try { const v = localStorage.getItem(KEY); return v ? JSON.parse(v) : SEED_LEADS; } catch { return SEED_LEADS; }
}
export const saveLeads = (l: Lead[]) => localStorage.setItem(KEY, JSON.stringify(l));
export function scoreLead(l: Partial<Lead>) {
  let s = 20;
  if (l.societe) s += 15; if (l.reference) s += 20; if (l.quantite) s += 10; if (l.produit && l.produit !== "Autre") s += 10;
  if (l.urgence === "Urgente") s += 10; if (l.urgence?.startsWith("Critique")) s += 20; if ((l.message ?? "").length > 60) s += 5;
  return Math.min(100, s);
}
export function missing(l: Lead) {
  return [!l.societe && "Société", !l.reference && "Référence", !l.quantite && "Quantité", !l.ville && "Ville"].filter(Boolean) as string[];
}
