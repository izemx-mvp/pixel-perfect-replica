import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { IndustrialBackground } from "@/components/IndustrialBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEMO_EMAIL, DEMO_PASSWORD, useApp } from "@/lib/app-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — Espace Service Client Rousseau Distribution" },
      {
        name: "description",
        content:
          "Accédez à votre espace Service Client Rousseau Distribution : FAQ, documents, informations et assistant IA d'identification de pièces.",
      },
      { property: "og:title", content: "Connexion — Rousseau Distribution" },
      {
        property: "og:description",
        content: "Espace Service Client Rousseau Distribution, partenaire de la fourniture industrielle.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, authed, ready } = useApp();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotState, setForgotState] = useState<"idle" | "loading" | "sent">("idle");
  const [forgotError, setForgotError] = useState("");

  useEffect(() => {
    if (ready && authed) navigate({ to: "/" });
  }, [ready, authed, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Veuillez compléter les informations nécessaires.");
      return;
    }
    setError("");
    setState("loading");
    window.setTimeout(() => {
      if (login(email, password)) {
        setState("success");
        toast.success("Connexion réussie");
        window.setTimeout(() => navigate({ to: "/" }), 700);
      } else {
        setState("idle");
        setError("Adresse e-mail ou mot de passe incorrect.");
      }
    }, 900);
  };

  return (
    <div className="relative min-h-screen">
      <IndustrialBackground />
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-5 py-12 lg:grid-cols-2 lg:px-8">
        <section className="animate-rise">
          <Logo size="lg" />
          <h1 className="mt-10 max-w-xl text-4xl font-extrabold leading-[1.05] sm:text-5xl">
            La force de vos machines, notre engagement
          </h1>
          <p className="mt-5 font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Partenaire de la fourniture industrielle
          </p>
          <p className="mt-5 max-w-lg text-muted-foreground">
            Des solutions industrielles fiables pour accompagner la maintenance, la production et la
            performance de vos équipements.
          </p>
          <div className="mt-10 flex flex-wrap gap-2">
            {["SKF", "Norton", "Loxeal", "Mahle"].map((b) => (
              <span
                key={b}
                className="rounded-full border border-border px-4 py-1.5 font-display text-xs font-semibold tracking-wider text-muted-foreground"
              >
                {b}
              </span>
            ))}
          </div>
        </section>

        <section className="animate-rise">
          <div className="relative overflow-hidden rounded-xl p-8 panel">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-primary" />
            <h2 className="text-2xl font-bold">Bienvenue</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Accédez à votre espace Service Client
            </p>

            <form onSubmit={submit} className="mt-7 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@entreprise.ma"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(v) => setRemember(Boolean(v))}
                    aria-label="Se souvenir de moi"
                  />
                  Se souvenir de moi
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotOpen(true);
                    setForgotState("idle");
                    setForgotError("");
                    setForgotEmail(email);
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={state !== "idle"}
              >
                {state === "loading" && <Loader2 className="size-4 animate-spin" />}
                {state === "success" && <Check className="size-4" />}
                {state === "loading"
                  ? "Connexion..."
                  : state === "success"
                    ? "Connexion réussie"
                    : "Se connecter"}
              </Button>
            </form>

            <div className="mt-6 rounded-md border border-border bg-muted/50 p-4">
              <p className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="size-4 text-primary" /> Compte démonstration
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {DEMO_EMAIL} · {DEMO_PASSWORD}
              </p>
              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={() => {
                  setEmail(DEMO_EMAIL);
                  setPassword(DEMO_PASSWORD);
                  setError("");
                  toast.success("Identifiants de démonstration remplis");
                }}
              >
                Utiliser le compte démonstration
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialiser votre mot de passe</DialogTitle>
            <DialogDescription>
              Indiquez votre adresse e-mail pour recevoir un lien de réinitialisation.
            </DialogDescription>
          </DialogHeader>
          {forgotState === "sent" ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15">
                <Check className="size-7 text-success" />
              </div>
              <p className="text-sm font-medium">Un lien de réinitialisation a été envoyé.</p>
              <Button className="w-full" onClick={() => setForgotOpen(false)}>
                Fermer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Adresse e-mail</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="vous@entreprise.ma"
                />
              </div>
              {forgotError && <p className="text-sm text-destructive">{forgotError}</p>}
              <Button
                className="w-full"
                disabled={forgotState === "loading"}
                onClick={() => {
                  if (!/^\S+@\S+\.\S+$/.test(forgotEmail.trim())) {
                    setForgotError("Veuillez saisir une adresse e-mail valide.");
                    return;
                  }
                  setForgotError("");
                  setForgotState("loading");
                  window.setTimeout(() => setForgotState("sent"), 1200);
                }}
              >
                {forgotState === "loading" && <Loader2 className="size-4 animate-spin" />}
                {forgotState === "loading" ? "Envoi..." : "Envoyer le lien"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
