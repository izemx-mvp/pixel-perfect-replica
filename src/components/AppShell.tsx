import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Bell,
  BookOpen,
  FileText,
  Info,
  LogOut,
  Mail,
  Moon,
  Search,
  Settings,
  Sun,
  User,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { IndustrialBackground } from "@/components/IndustrialBackground";
import { AIRequestModal } from "@/components/AIRequestModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useApp } from "@/lib/app-store";
import { DOCUMENTS, FAQS, LOCATIONS } from "@/data/content";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/faq", label: "FAQ", short: "FAQ", icon: BookOpen },
  { to: "/documents", label: "Documents", short: "Documents", icon: FileText },
  { to: "/informations", label: "Informations générales", short: "Infos", icon: Info },
] as const;

type Shell = { openAI: () => void };
const ShellCtx = createContext<Shell>({ openAI: () => {} });
export const useShell = () => useContext(ShellCtx);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { requests } = useApp();

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return [];
    const out: { label: string; hint: string; to: string }[] = [];
    FAQS.filter((f) => (f.question + f.answer).toLowerCase().includes(q)).forEach((f) =>
      out.push({ label: f.question, hint: "FAQ", to: "/faq" }),
    );
    DOCUMENTS.filter((d) => (d.title + d.description).toLowerCase().includes(q)).forEach((d) =>
      out.push({ label: d.title, hint: "Document", to: "/documents" }),
    );
    LOCATIONS.filter((l) => (l.name + l.address + l.city).toLowerCase().includes(q)).forEach((l) =>
      out.push({ label: `Agence ${l.name} — ${l.address}`, hint: "Informations", to: "/informations" }),
    );
    requests
      .filter((r) => (r.reference + r.description + r.type + r.brand).toLowerCase().includes(q))
      .forEach((r) =>
        out.push({ label: `${r.reference} — ${r.type}`, hint: "Demande IA", to: "/demandes" }),
      );
    return out.slice(0, 12);
  }, [q, requests]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Recherche globale</DialogTitle>
          <DialogDescription>Rechercher dans votre espace</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher dans votre espace..."
            className="w-full bg-transparent py-2 text-sm outline-none"
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {!q && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Veuillez saisir une recherche.
            </p>
          )}
          {q && results.length === 0 && (
            <div className="px-3 py-8 text-center">
              <p className="text-sm font-medium">Aucun résultat trouvé</p>
              <Button variant="outline" className="mt-4" onClick={() => setQuery("")}>
                Réinitialiser
              </Button>
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.to}-${i}`}
              onClick={() => {
                onOpenChange(false);
                setQuery("");
                navigate({ to: r.to });
              }}
              className="flex w-full items-center justify-between gap-4 rounded-md px-3 py-3 text-left text-sm transition-colors hover:bg-accent"
            >
              <span className="truncate">{r.label}</span>
              <Badge variant="secondary">{r.hint}</Badge>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const {
    ready,
    authed,
    logout,
    profile,
    saveProfile,
    theme,
    setTheme,
    notifsEnabled,
    setNotifsEnabled,
    notifications,
    unread,
    markRead,
    markAllRead,
  } = useApp();

  const [searchOpen, setSearchOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [draft, setDraft] = useState(profile);

  useEffect(() => setDraft(profile), [profile]);

  useEffect(() => {
    if (ready && !authed) navigate({ to: "/login" });
  }, [ready, authed, navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const initials = profile.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (!ready || !authed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Logo size="md" className="animate-pulse" />
      </div>
    );
  }

  return (
    <ShellCtx.Provider value={{ openAI: () => setAiOpen(true) }}>
      <IndustrialBackground />
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link to="/" aria-label="Accueil Service Client">
              <Logo size="sm" />
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "relative rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                    pathname === n.to ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {n.label}
                  {pathname === n.to && (
                    <span className="absolute inset-x-3 -bottom-[5px] h-[2px] rounded-full bg-primary" />
                  )}
                </Link>
              ))}
              <Link
                to="/demandes"
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === "/demandes" ? "text-primary" : "text-muted-foreground",
                )}
              >
                Mes demandes
              </Link>
            </nav>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Recherche globale"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="size-4" />
              </Button>

              <Popover open={bellOpen} onOpenChange={setBellOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                    <Bell className="size-4" />
                    {notifsEnabled && unread > 0 && (
                      <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {unread}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[22rem] p-0">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <p className="font-display text-sm font-bold">Notifications</p>
                    <button
                      className="text-xs text-primary hover:underline"
                      onClick={() => {
                        markAllRead();
                        toast.success("Toutes les notifications ont été marquées comme lues");
                      }}
                    >
                      Tout marquer comme lu
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          if (!n.read) {
                            markRead(n.id);
                            toast.success("Notification marquée comme lue");
                          }
                        }}
                        className="flex w-full gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-accent"
                      >
                        <span
                          className={cn(
                            "mt-1.5 size-2 shrink-0 rounded-full",
                            n.read ? "bg-border" : "bg-primary",
                          )}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{n.title}</span>
                          <span className="block text-xs text-muted-foreground">{n.message}</span>
                          <span className="mt-1 block text-[11px] text-muted-foreground">
                            {formatDate(n.date)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border p-2">
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setBellOpen(false);
                        navigate({ to: "/notifications" });
                      }}
                    >
                      Voir toutes les notifications
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-1 flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 transition-colors hover:border-primary/50">
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {initials}
                    </span>
                    <span className="hidden text-xs font-semibold sm:inline">Espace Client</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="text-sm font-semibold">{profile.name}</p>
                    <p className="text-xs font-normal text-muted-foreground">{profile.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
                    <User className="size-4" /> Mon profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate({ to: "/notifications" })}>
                    <Bell className="size-4" /> Notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setPrefsOpen(true)}>
                    <Settings className="size-4" /> Préférences
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      logout();
                      toast.success("Déconnexion réussie");
                      navigate({ to: "/login" });
                    }}
                  >
                    <LogOut className="size-4" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-8 sm:px-6 md:pb-16">
          {children}
        </main>

        <footer className="border-t border-border bg-card/60 py-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 text-center sm:px-6">
            <Logo size="sm" />
            <p className="text-xs text-muted-foreground">
              La force de vos machines, notre engagement — Partenaire de la fourniture industrielle
            </p>
            <p className="text-[11px] text-muted-foreground">
              Espace de démonstration — données locales, sans transmission réelle.
            </p>
          </div>
        </footer>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
          <div className="grid grid-cols-4">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  pathname === n.to ? "text-primary" : "text-muted-foreground",
                )}
              >
                <n.icon className="size-4" />
                {n.short}
              </Link>
            ))}
            <button
              onClick={() => setAiOpen(true)}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-primary"
            >
              <Mail className="size-4" />
              Pièce IA
            </button>
          </div>
        </nav>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <AIRequestModal open={aiOpen} onOpenChange={setAiOpen} />

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mon profil</DialogTitle>
            <DialogDescription>Modifiez vos informations de compte.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-name">Nom</Label>
              <Input
                id="p-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-email">Adresse e-mail</Label>
              <Input
                id="p-email"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Société</Label>
              <Input value={draft.company} readOnly className="bg-muted" />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (!draft.name.trim() || !/^\S+@\S+\.\S+$/.test(draft.email)) {
                  toast.error("Veuillez compléter les informations nécessaires.");
                  return;
                }
                saveProfile({ name: draft.name.trim(), email: draft.email.trim() });
                setProfileOpen(false);
                toast.success("Profil mis à jour");
              }}
            >
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Préférences</DialogTitle>
            <DialogDescription>Personnalisez votre espace client.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                <div>
                  <p className="text-sm font-semibold">Thème</p>
                  <p className="text-xs text-muted-foreground">
                    {theme === "dark" ? "Dark" : "Light"}
                  </p>
                </div>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
                aria-label="Basculer le thème"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <Bell className="size-4" />
                <div>
                  <p className="text-sm font-semibold">Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    {notifsEnabled ? "Activées" : "Désactivées"}
                  </p>
                </div>
              </div>
              <Switch
                checked={notifsEnabled}
                onCheckedChange={(v) => {
                  setNotifsEnabled(v);
                  toast.success(v ? "Notifications activées" : "Notifications désactivées");
                }}
                aria-label="Activer les notifications"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ShellCtx.Provider>
  );
}
