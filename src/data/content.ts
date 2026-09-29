export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

export const FAQ_CATEGORIES = [
  "Tous",
  "Produits",
  "Roulements",
  "Transmission",
  "Lubrification",
  "Abrasifs",
  "Commandes",
  "Disponibilité",
];

export const FAQS: Faq[] = [
  {
    id: "faq-1",
    question: "Quels types de produits propose Rousseau Distribution ?",
    answer:
      "Rousseau Distribution couvre l'ensemble de la fourniture industrielle : roulements, courroies, transmission mécanique, poulies, paliers, chaînes, accouplements, lubrification, abrasifs industriels, pièces moteur, outillage et machines-outils.",
    category: "Produits",
  },
  {
    id: "faq-2",
    question: "Quelles marques distribuez-vous ?",
    answer:
      "Nous travaillons notamment avec SKF, Norton, Loxeal et Mahle, ainsi qu'avec des références équivalentes selon la disponibilité et l'application de votre machine.",
    category: "Produits",
  },
  {
    id: "faq-3",
    question: "Comment identifier une pièce ?",
    answer:
      "Le plus rapide est d'utiliser l'assistant IA « Identifier ma pièce avec l'IA » : décrivez la pièce, ajoutez une photo, la marque ou la référence gravée, et la demande est qualifiée automatiquement avant transmission.",
    category: "Roulements",
  },
  {
    id: "faq-4",
    question: "Comment demander un devis ?",
    answer:
      "Créez une demande depuis l'assistant IA ou contactez directement l'agence. Plus la référence, les dimensions et le secteur d'utilisation sont précis, plus le devis est rapide.",
    category: "Commandes",
  },
  {
    id: "faq-5",
    question: "Comment vérifier la disponibilité ?",
    answer:
      "La disponibilité dépend de la référence et du site. Une demande qualifiée dans cet espace permet à l'équipe commerciale de confirmer le stock et le délai d'approvisionnement.",
    category: "Disponibilité",
  },
  {
    id: "faq-6",
    question: "Travaillez-vous avec différents secteurs industriels ?",
    answer:
      "Oui : agroalimentaire, pharmaceutique, industrie manufacturière, maintenance industrielle, production et logistique font partie de nos environnements habituels.",
    category: "Produits",
  },
  {
    id: "faq-7",
    question: "Quel roulement choisir pour une charge radiale élevée ?",
    answer:
      "Pour une charge radiale importante, un roulement à rouleaux cylindriques est généralement préférable à un roulement à billes. Indiquez la vitesse, la charge et l'environnement pour une recommandation adaptée.",
    category: "Roulements",
  },
  {
    id: "faq-8",
    question: "Comment déterminer la bonne courroie de transmission ?",
    answer:
      "La section, la longueur primitive et le nombre de brins dépendent de la puissance transmise et de l'entraxe. Un relevé du marquage de la courroie usée suffit souvent à retrouver l'équivalence.",
    category: "Transmission",
  },
  {
    id: "faq-9",
    question: "Quelle graisse utiliser en environnement agroalimentaire ?",
    answer:
      "Les environnements agroalimentaires exigent des lubrifiants à usage alimentaire compatibles avec les contacts occasionnels. Précisez la température de service et la nature du contact.",
    category: "Lubrification",
  },
  {
    id: "faq-10",
    question: "Quels abrasifs pour le travail de l'inox ?",
    answer:
      "Pour l'inox, privilégiez des abrasifs sans fer, soufre ni chlore afin d'éviter la contamination. Indiquez l'outil utilisé et le niveau de finition recherché.",
    category: "Abrasifs",
  },
  {
    id: "faq-11",
    question: "Quels sont les délais de traitement d'une commande ?",
    answer:
      "Les articles courants sont traités rapidement depuis le stock agence. Les références spécifiques font l'objet d'une confirmation de délai par l'équipe commerciale.",
    category: "Commandes",
  },
  {
    id: "faq-12",
    question: "Puis-je suivre mes demandes dans cet espace ?",
    answer:
      "Oui, chaque demande qualifiée apparaît dans « Mes demandes » avec sa référence, son statut et son historique.",
    category: "Disponibilité",
  },
];

export type Doc = {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
  format: string;
  size: string;
  pages: number;
};

export const DOC_CATEGORIES = [
  "Tous",
  "Catalogues",
  "Documentation technique",
  "Fiches produits",
  "Guides",
  "Nouveautés",
  "Favoris",
];

export const DOCUMENTS: Doc[] = [
  {
    id: "doc-1",
    title: "Catalogue général Rousseau Distribution",
    category: "Catalogues",
    description:
      "Vue d'ensemble de l'offre : roulements, transmission, lubrification, abrasifs et outillage.",
    date: "2026-02-18",
    format: "PDF",
    size: "8,4 Mo",
    pages: 164,
  },
  {
    id: "doc-2",
    title: "Guide Transmission Mécanique",
    category: "Guides",
    description:
      "Méthode de sélection des courroies, poulies, chaînes et accouplements selon la puissance transmise.",
    date: "2026-03-02",
    format: "PDF",
    size: "3,1 Mo",
    pages: 48,
  },
  {
    id: "doc-3",
    title: "Documentation technique Roulements SKF",
    category: "Documentation technique",
    description:
      "Tables de charges, jeux internes, montage et démontage des roulements et paliers.",
    date: "2026-01-27",
    format: "PDF",
    size: "5,6 Mo",
    pages: 92,
  },
  {
    id: "doc-4",
    title: "Fiche produit — Paliers et supports",
    category: "Fiches produits",
    description: "Dimensions, matières et conditions d'utilisation des paliers standards.",
    date: "2025-12-11",
    format: "PDF",
    size: "1,2 Mo",
    pages: 12,
  },
  {
    id: "doc-5",
    title: "Guide Lubrification industrielle",
    category: "Guides",
    description:
      "Choix des graisses et huiles selon la température, la vitesse et l'environnement de production.",
    date: "2026-02-04",
    format: "PDF",
    size: "2,7 Mo",
    pages: 36,
  },
  {
    id: "doc-6",
    title: "Abrasifs Norton — Sélection et sécurité",
    category: "Documentation technique",
    description: "Disques, meules et bandes : compatibilité matière et règles de sécurité.",
    date: "2026-01-09",
    format: "PDF",
    size: "4,0 Mo",
    pages: 54,
  },
  {
    id: "doc-7",
    title: "Nouveautés 2026 — Composants industriels",
    category: "Nouveautés",
    description: "Nouvelles références disponibles en agence et évolutions de gamme.",
    date: "2026-03-15",
    format: "PDF",
    size: "1,9 Mo",
    pages: 18,
  },
  {
    id: "doc-8",
    title: "Fiche produit — Courroies trapézoïdales",
    category: "Fiches produits",
    description: "Sections, longueurs primitives et équivalences de marquage.",
    date: "2025-11-20",
    format: "PDF",
    size: "0,9 Mo",
    pages: 8,
  },
  {
    id: "doc-9",
    title: "Catalogue Outillage & Machines-outils",
    category: "Catalogues",
    description: "Outillage professionnel, accessoires et machines pour atelier de maintenance.",
    date: "2025-10-30",
    format: "PDF",
    size: "6,3 Mo",
    pages: 120,
  },
];

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
};

export const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n-1",
    title: "Nouvelle documentation",
    message: "Le guide Transmission Mécanique est disponible.",
    date: "2026-03-02T09:15:00",
    read: false,
  },
  {
    id: "n-2",
    title: "Mise à jour",
    message: "Les informations du Service Client ont été mises à jour.",
    date: "2026-02-24T14:40:00",
    read: false,
  },
  {
    id: "n-3",
    title: "Bienvenue",
    message: "Bienvenue dans votre espace client Rousseau Distribution.",
    date: "2026-02-18T08:05:00",
    read: false,
  },
];

export type Location = {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  lat: number;
  lng: number;
};

export const LOCATIONS: Location[] = [
  {
    id: "casablanca",
    name: "Casablanca",
    address: "76 Boulevard Khouribga",
    city: "Casablanca 20250, Maroc",
    phone: "+212 522 44 82 77",
    lat: 33.5883,
    lng: -7.6114,
  },
  {
    id: "meknes",
    name: "Meknès",
    address: "14 Rue Chefchaouen",
    city: "Meknès, Maroc",
    phone: "+212 522 44 82 77",
    lat: 33.8935,
    lng: -5.5473,
  },
];

export const OPENING_HOURS = [
  { day: "Lundi", slots: ["08:30–12:30", "14:30–18:30"] },
  { day: "Mardi", slots: ["08:30–12:30", "14:30–18:30"] },
  { day: "Mercredi", slots: ["08:30–12:30", "14:30–18:30"] },
  { day: "Jeudi", slots: ["08:30–12:30", "14:30–18:30"] },
  { day: "Vendredi", slots: ["08:30–12:30", "14:30–18:30"] },
  { day: "Samedi", slots: [] },
  { day: "Dimanche", slots: [] },
];

export const PART_TYPES = [
  "Roulement",
  "Courroie",
  "Transmission",
  "Poulie",
  "Palier",
  "Lubrifiant",
  "Abrasif",
  "Pièce moteur",
  "Autre",
];

export const SECTORS = [
  "Agroalimentaire",
  "Pharmaceutique",
  "Automobile",
  "Industrie",
  "Maintenance",
  "Autre",
];

export type RequestStatus =
  | "Demande reçue"
  | "En cours d'analyse"
  | "Informations complémentaires nécessaires"
  | "Traitée";

export type PartRequest = {
  reference: string;
  date: string;
  description: string;
  type: string;
  brand: string;
  partRef: string;
  machine: string;
  sector: string;
  status: RequestStatus;
  hasPhoto: boolean;
};

export const DEMO_REQUESTS: PartRequest[] = [
  {
    reference: "RD-2026-1043",
    date: "2026-02-26T10:12:00",
    description: "Roulement de broche pour convoyeur ligne d'embouteillage.",
    type: "Roulement",
    brand: "SKF",
    partRef: "6205-2RS",
    machine: "Convoyeur L2",
    sector: "Agroalimentaire",
    status: "Traitée",
    hasPhoto: false,
  },
  {
    reference: "RD-2026-2317",
    date: "2026-03-05T16:45:00",
    description: "Courroie de transmission pour compresseur atelier.",
    type: "Courroie",
    brand: "Non renseignée",
    partRef: "Non renseignée",
    machine: "Compresseur atelier",
    sector: "Maintenance",
    status: "Informations complémentaires nécessaires",
    hasPhoto: false,
  },
];
