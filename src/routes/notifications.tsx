import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bell, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Espace client Rousseau Distribution" },
      {
        name: "description",
        content:
          "Toutes vos notifications Rousseau Distribution : nouvelles documentations, mises à jour du Service Client et messages de bienvenue.",
      },
      { property: "og:title", content: "Notifications — Rousseau Distribution" },
      {
        property: "og:description",
        content: "Consultez et gérez les notifications de votre espace Service Client.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <NotificationsPage />
    </AppShell>
  ),
});

function NotificationsPage() {
  const { notifications, unread, markRead, markAllRead } = useApp();
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notifications.filter((n) => !q || (n.title + n.message).toLowerCase().includes(q));
  }, [notifications, query]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 animate-rise">
        <div>
          <p className="text-kicker">Espace client</p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Notifications</h1>
          <p className="mt-2 text-muted-foreground">
            {unread} notification{unread > 1 ? "s" : ""} non lue{unread > 1 ? "s" : ""}.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            markAllRead();
            toast.success("Toutes les notifications ont été marquées comme lues");
          }}
        >
          Tout marquer comme lu
        </Button>
      </header>

      <div className="relative max-w-lg">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une notification..."
          className="pl-9"
        />
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl px-6 py-14 text-center panel">
          <h2 className="text-xl font-bold">Aucun résultat trouvé.</h2>
          <Button variant="outline" className="mt-6" onClick={() => setQuery("")}>
            Réinitialiser
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => {
                  if (!n.read) {
                    markRead(n.id);
                    toast.success("Notification marquée comme lue");
                  }
                }}
                className={cn(
                  "flex w-full items-start gap-4 rounded-xl p-5 text-left panel hover-lift",
                  !n.read && "border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
                  )}
                >
                  <Bell className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-bold">{n.title}</span>
                    {!n.read && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                        Nouveau
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{n.message}</span>
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {new Date(n.date).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
