# Restructure: Dashboard + Rapports & Analyse + Service Client + Qualification WhatsApp

## New navigation (top bar)
1. **Dashboard** (new home, replaces redirect to /analyse)
2. **Rapports & Analyse** (the existing Analyse interface, extended per the uploaded spec)
3. **Service Client** (FAQ / Documents / Informations — unchanged)
4. **Qualification IA** (rebuilt as WhatsApp leads pipeline)

**Consolidation des Données is deleted** (page, nav link, localStorage key, references).

## 1. Dashboard
- KPI cards: Chiffre d'affaires, Visites, Offres en cours, Taux de conversion, Nouveaux contacts WhatsApp.
- Charts: sales evolution (line), top commerciaux (bar), top produits (bar), ventes par secteur (donut).
- Activity feed ("Nouveau rapport de visite reçu de Karim, client X, il y a 5 min", new WhatsApp lead...).
- Alerts: références forte demande en rupture, commerciaux sans rapport depuis X jours, offres sans réponse.
- Quick actions: Générer un rapport, Dernières visites, Offres à relancer, Voir le pipeline WhatsApp.

## 2. Rapports & Analyse (left sidebar inside the interface)
Sidebar: Accueil, Commerciaux, Produits / Références, Clients, Ventes, Stock, Offres, Visites, Rapport personnalisé (IA), Historique.
- Top bar: quick search + global filters (période, commercial, secteur) applied to every sub-page. No "last update" badge, no source/integration status.
- Collapsible right panel **Assistant IA** on every sub-page: chat, answers as text / small table / mini chart, keeps context ("et pour le mois précédent ?"), "Transformer en rapport".
- **Commerciaux**: list with indicators, detail view (visits, products proposed/sold, offers by status, evolution, vs team average), Comparatif tab, Exporter en PDF.
- **Visites**: filterable table, detail (rep, client, date, contact, objet, références, offre, résultat, prochaine action) + "Rapport de visite d'origine" preview table.
- **Produits / Références**: most sold / most requested, detail with highlighted KPI "Nombre de clients ayant demandé", stock, clients acheteurs/demandeurs, top reps, offres liées; "Forte demande / faible stock" with tag À approvisionner; report by family.
- **Clients / Ventes / Stock / Offres**: details, top & inactive clients, comparisons vs previous period, shortages, demand vs stock chart, offers to follow up, pipeline total.
- **Rapport personnalisé (IA)**: natural-language input + example prompts, selectors, AI rephrasing with Valider / Modifier, simulated loading, generated report (KPIs, table, charts, Résumé IA, Recommandations), refinement chat, Exporter PDF (logo), Exporter Excel, Envoyer par email (simulated), Enregistrer comme modèle, Planifier.
- **Historique**: generated reports list with Rouvrir, Dupliquer, Régénérer (localStorage).
- Clickable figures open the underlying rows.

## 3. Qualification IA — WhatsApp pipeline
- Kanban pipeline: Nouveau contact → À qualifier → Qualifié → Offre envoyée → Gagné / Perdu (drag or move buttons).
- Each lead: nom, société, téléphone WhatsApp, ville, secteur, produit/référence demandé, quantité, urgence, message WhatsApp d'origine (chat bubble preview), score IA, résumé IA, notes.
- Actions: **Voir détails** (side panel with conversation + IA qualification), **Ajouter**, **Modifier**, **Supprimer** (with confirmation), search and filters. All saved in the browser (no real WhatsApp connection, labeled démo).
- Table/list view toggle.

## Data
- Rework the shared dataset to the spec: 5 commerciaux, ~25 clients (Agroalimentaire, Pharmaceutique, Automobile, Textile, Cimenterie), ~40 références (Moteurs, Courroies, Transmission mécanique, Roulements), ~60 visites, ~40 offres (Conclue / En attente / Perdue, MAD), ~15 WhatsApp leads. Consistent across Dashboard and Rapports.

## Technical notes
- Routes: `/` Dashboard, `/rapports` layout with child routes per sidebar entry (old `/analyse` redirects to `/rapports`), delete `/consolidation`, `/qualification` rebuilt.
- Update AGENTS.md and project knowledge memory (4 interfaces now = Dashboard, Rapports, Service Client, Qualification).
