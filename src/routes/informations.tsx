import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, ExternalLink, Facebook, Linkedin, MapPin, Phone } from "lucide-react";
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
      <InfosPage />
    </AppShell>
  ),
});

function useOpenStatus() {
  return useMemo(() => {
    const now = new Date();
    const idx = (now.getDay() + 6) % 7; // 0 = Lundi
    const today = OPENING_HOURS[idx];
    const minutes = now.getHours() * 60 + now.getMinutes();
    const isOpen = today.slots.some((s) => {
      const [start, end] = s.split("–");
      const toMin = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };
      return minutes >= toMin(start) && minutes <= toMin(end);
    });
    return { todayIndex: idx, isOpen };
  }, []);
}

function InfosPage() {
  const [locationId, setLocationId] = useState(LOCATIONS[0].id);
  const location = LOCATIONS.find((l) => l.id === locationId)!;
  const { todayIndex, isOpen } = useOpenStatus();

  const bbox = [location.lng - 0.02, location.lat - 0.012, location.lng + 0.02, location.lat + 0.012].join(
    ",",
  );
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${location.lat},${location.lng}`;
  const gmaps = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;

  return (
    <div className="space-y-8">
      <header className="animate-rise">
        <p className="text-kicker">Rousseau Distribution</p>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Informations générales</h1>
        <p className="mt-2 text-muted-foreground">Horaires, contact et localisation de nos agences.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl p-6 panel lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Clock className="size-4 text-primary" /> Horaires
            </h2>
            <span
              className={cn(
                "rounded-full px-3 py-1 font-display text-xs font-bold tracking-wider",
                isOpen ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
              )}
            >
              {isOpen ? "OUVERT" : "FERMÉ"}
            </span>
          </div>
          <ul className="mt-5 space-y-2 text-sm">
            {OPENING_HOURS.map((h, i) => (
              <li
                key={h.day}
                className={cn(
                  "flex items-start justify-between gap-4 rounded-md px-3 py-2",
                  i === todayIndex && "bg-primary/8 font-semibold text-foreground",
                )}
              >
                <span>{h.day}</span>
                <span className="text-right text-muted-foreground">
                  {h.slots.length ? h.slots.map((s) => <span key={s} className="block">{s}</span>) : "Fermé"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl p-6 panel lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <MapPin className="size-4 text-primary" /> Nos agences
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {LOCATIONS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLocationId(l.id)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  l.id === locationId
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {l.name}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="font-display text-base font-bold">{location.name}</p>
              <p className="mt-2 text-sm text-muted-foreground">{location.address}</p>
              <p className="text-sm text-muted-foreground">{location.city}</p>
              <p className="mt-4 text-sm font-semibold">{location.phone}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild>
                  <a href={`tel:${location.phone.replace(/\s/g, "")}`}>
                    <Phone className="size-4" /> Appeler
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={gmaps} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" /> Ouvrir dans Google Maps
                  </a>
                </Button>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border border-border">
              <iframe
                key={location.id}
                title={`Carte ${location.name}`}
                src={mapSrc}
                className="h-56 w-full"
                loading="lazy"
              />
              <span className="pointer-events-none absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary animate-pulse-ring" />
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-xl p-6 panel">
        <h2 className="text-lg font-bold">Suivez-nous</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Retrouvez l'actualité de Rousseau Distribution sur nos profils officiels.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <a
              href="https://www.linkedin.com/search/results/companies/?keywords=Rousseau%20Distribution"
              target="_blank"
              rel="noreferrer"
            >
              <Linkedin className="size-4" /> LinkedIn
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a
              href="https://www.facebook.com/search/top?q=Rousseau%20Distribution"
              target="_blank"
              rel="noreferrer"
            >
              <Facebook className="size-4" /> Facebook
            </a>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Les liens ouvrent une recherche officielle : aucune adresse de profil n'a été inventée.
        </p>
      </section>
    </div>
  );
}
