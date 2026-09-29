import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, ExternalLink, Link2, MapPin, Pencil, Phone, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EditDialog, useStored } from "@/lib/editable";
import type { Location } from "@/data/content";
import { ServiceClientTabs } from "@/components/ServiceClientTabs";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { LOCATIONS, OPENING_HOURS } from "@/data/content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/informations")({
  head: () => ({
    meta: [
      { title: "Informations générales — Rousseau Distribution" },
      {
        name: "description",
        content:
          "Horaires d'ouverture, contact téléphonique, agences de Casablanca et Meknès et localisation de Rousseau Distribution.",
      },
      { property: "og:title", content: "Informations générales — Rousseau Distribution" },
      {
        property: "og:description",
        content: "Horaires, contact et localisation des agences Rousseau Distribution au Maroc.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <ServiceClientTabs />
      <InfosPage />
    </AppShell>
  ),
});

type Hours = { day: string; slots: string[] };
type Social = { id: string; name: string; url: string };
const SOCIALS: Social[] = [
  { id: "s1", name: "LinkedIn", url: "https://www.linkedin.com/search/results/companies/?keywords=Rousseau%20Distribution" },
  { id: "s2", name: "Facebook", url: "https://www.facebook.com/search/top?q=Rousseau%20Distribution" },
];

function useOpenStatus(hours: Hours[]) {
  return useMemo(() => {
    const now = new Date();
    const idx = (now.getDay() + 6) % 7;
    const minutes = now.getHours() * 60 + now.getMinutes();
    const toMin = (t: string) => { const [h, m] = t.trim().split(":"); return Number(h) * 60 + Number(m); };
    const isOpen = Boolean(hours[idx]?.slots.some((s) => { const [a, b] = s.split(/[–-]/); return a && b ? minutes >= toMin(a) && minutes <= toMin(b) : false; }));
    return { todayIndex: idx, isOpen };
  }, [hours]);
}

const safeUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

function InfosPage() {
  const [hours, setHours, resetHours] = useStored<Hours[]>("rd_hours", OPENING_HOURS);
  const [locs, setLocs, resetLocs] = useStored<Location[]>("rd_locations", LOCATIONS);
  const [socials, setSocials, resetSocials] = useStored<Social[]>("rd_socials", SOCIALS);
  const [locationId, setLocationId] = useState(LOCATIONS[0]!.id);
  const [editHours, setEditHours] = useState(false);
  const [editLoc, setEditLoc] = useState<Location | null>(null);
  const [editSoc, setEditSoc] = useState<Social | null>(null);
  const location = locs.find((l) => l.id === locationId) ?? locs[0];
  const { todayIndex, isOpen } = useOpenStatus(hours);
  const hoursForm = Object.fromEntries(hours.map((h) => [h.day, h.slots.join(", ")])) as Record<string, string>;

  const bbox = location ? [location.lng - 0.02, location.lat - 0.012, location.lng + 0.02, location.lat + 0.012].join(",") : "";
  const mapSrc = location ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${location.lat},${location.lng}` : "";
  const gmaps = location ? `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}` : "#";

  return (
    <div className="space-y-8">
      <header className="animate-rise flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-kicker">Rousseau Distribution</p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Informations générales</h1>
          <p className="mt-2 text-muted-foreground">Horaires, contact et localisation de nos agences — tout est modifiable.</p>
        </div>
        <Button variant="outline" onClick={() => { resetHours(); resetLocs(); resetSocials(); setLocationId(LOCATIONS[0]!.id); toast.success("Informations réinitialisées"); }}><RotateCcw className="size-4" /> Réinitialiser</Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl p-6 panel lg:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Clock className="size-4 text-primary" /> Horaires</h2>
            <div className="flex items-center gap-1">
              <span className={cn("rounded-full px-3 py-1 font-display text-xs font-bold tracking-wider", isOpen ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>{isOpen ? "OUVERT" : "FERMÉ"}</span>
              <Button size="icon" variant="ghost" aria-label="Modifier les horaires" onClick={() => setEditHours(true)}><Pencil className="size-4" /></Button>
            </div>
          </div>
          <ul className="mt-5 space-y-2 text-sm">
            {hours.map((h, i) => (
              <li key={h.day} className={cn("flex items-start justify-between gap-4 rounded-md px-3 py-2", i === todayIndex && "bg-primary/8 font-semibold text-foreground")}>
                <span>{h.day}</span>
                <span className="text-right text-muted-foreground">{h.slots.length ? h.slots.map((s) => <span key={s} className="block">{s}</span>) : "Fermé"}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl p-6 panel lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-bold"><MapPin className="size-4 text-primary" /> Nos agences</h2>
            <Button size="sm" onClick={() => setEditLoc({ id: "", name: "", address: "", city: "", phone: "", lat: 33.5883, lng: -7.6114 })}><Plus className="size-4" /> Ajouter une agence</Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {locs.map((l) => (
              <button key={l.id} onClick={() => setLocationId(l.id)} className={cn("rounded-full border px-4 py-1.5 text-sm font-medium transition-colors", l.id === location?.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground")}>{l.name}</button>
            ))}
          </div>
          {location ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="font-display text-base font-bold">{location.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">{location.address}</p>
                <p className="text-sm text-muted-foreground">{location.city}</p>
                <p className="mt-4 text-sm font-semibold">{location.phone}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild><a href={`tel:${location.phone.replace(/[^\d+]/g, "")}`}><Phone className="size-4" /> Appeler</a></Button>
                  <Button variant="outline" asChild><a href={gmaps} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> Ouvrir dans Google Maps</a></Button>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditLoc(location)}><Pencil className="size-3.5" /> Modifier</Button>
                  <Button size="sm" variant="outline" className="text-primary" onClick={() => { if (confirm("Supprimer cette agence ?")) { setLocs(locs.filter((x) => x.id !== location.id)); toast.success("Agence supprimée"); } }}><Trash2 className="size-3.5" /> Supprimer</Button>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-lg border border-border">
                <iframe key={location.id + location.lat + location.lng} title={`Carte ${location.name}`} src={mapSrc} className="h-56 w-full" loading="lazy" />
                <span className="pointer-events-none absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary animate-pulse-ring" />
              </div>
            </div>
          ) : <p className="mt-5 text-sm text-muted-foreground">Aucune agence. Ajoutez-en une.</p>}
        </section>
      </div>

      <section className="rounded-xl p-6 panel">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">Suivez-nous</h2>
            <p className="mt-1 text-sm text-muted-foreground">Liens vers les profils officiels de Rousseau Distribution.</p>
          </div>
          <Button size="sm" onClick={() => setEditSoc({ id: "", name: "", url: "" })}><Plus className="size-4" /> Ajouter un lien</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {socials.map((s) => (
            <div key={s.id} className="flex items-center gap-1 rounded-lg border border-border p-1">
              <Button variant="ghost" size="sm" asChild><a href={safeUrl(s.url)} target="_blank" rel="noreferrer"><Link2 className="size-4" /> {s.name}</a></Button>
              <Button size="icon" variant="ghost" className="size-8" aria-label="Modifier" onClick={() => setEditSoc(s)}><Pencil className="size-3.5" /></Button>
              <Button size="icon" variant="ghost" className="size-8 text-primary" aria-label="Supprimer" onClick={() => { setSocials(socials.filter((x) => x.id !== s.id)); toast.success("Lien supprimé"); }}><Trash2 className="size-3.5" /></Button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Remplacez les liens de recherche par les adresses officielles des profils.</p>
      </section>

      {editHours && (
        <EditDialog title="Modifier les horaires" value={hoursForm} onClose={() => setEditHours(false)}
          fields={hours.map((h) => ({ key: h.day, label: `${h.day} (ex. 08:30–12:30, 14:30–18:30 — vide = fermé)` }))}
          onSave={(v) => { setHours(hours.map((h) => ({ day: h.day, slots: String(v[h.day] ?? "").split(",").map((x) => x.trim()).filter(Boolean) }))); toast.success("Horaires mis à jour"); setEditHours(false); }} />
      )}
      {editLoc && (
        <EditDialog title={editLoc.id ? "Modifier l'agence" : "Ajouter une agence"} value={editLoc} onClose={() => setEditLoc(null)}
          fields={[{ key: "name", label: "Nom", required: true }, { key: "address", label: "Adresse", required: true }, { key: "city", label: "Ville / code postal" }, { key: "phone", label: "Téléphone" }, { key: "lat", label: "Latitude", type: "number" }, { key: "lng", label: "Longitude", type: "number" }]}
          onSave={(v) => { if (v.id) setLocs(locs.map((x) => (x.id === v.id ? v : x))); else { const id = `loc-${Date.now()}`; setLocs([...locs, { ...v, id }]); setLocationId(id); } toast.success(v.id ? "Agence modifiée" : "Agence ajoutée"); setEditLoc(null); }} />
      )}
      {editSoc && (
        <EditDialog title={editSoc.id ? "Modifier le lien" : "Ajouter un lien"} value={editSoc} onClose={() => setEditSoc(null)}
          fields={[{ key: "name", label: "Réseau (ex. LinkedIn)", required: true }, { key: "url", label: "Adresse du profil", required: true }]}
          onSave={(v) => { if (v.id) setSocials(socials.map((x) => (x.id === v.id ? v : x))); else setSocials([...socials, { ...v, id: `s-${Date.now()}` }]); toast.success("Lien enregistré"); setEditSoc(null); }} />
      )}
    </div>
  );
}
