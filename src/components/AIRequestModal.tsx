import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bot, Check, ImagePlus, Loader2, Sparkles, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PART_TYPES, SECTORS, type PartRequest } from "@/data/content";
import { useApp } from "@/lib/app-store";

const STEPS = [
  "Analyse de votre demande...",
  "Identification du type de pièce...",
  "Qualification des informations...",
  "Recherche des informations disponibles...",
  "Préparation de votre demande...",
];

type Phase = "form" | "analysing" | "result" | "sending" | "done";

const EMPTY = {
  description: "",
  type: "",
  brand: "",
  partRef: "",
  machine: "",
  sector: "",
};

function guessType(text: string) {
  const t = text.toLowerCase();
  const found = PART_TYPES.find((p) => t.includes(p.toLowerCase().slice(0, 6)));
  return found ?? "";
}

function guessBrand(text: string) {
  const brands = ["SKF", "Norton", "Loxeal", "Mahle"];
  return brands.find((b) => text.toLowerCase().includes(b.toLowerCase())) ?? "";
}

export function AIRequestModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addRequest } = useApp();
  const [phase, setPhase] = useState<Phase>("form");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...EMPTY });
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<PartRequest | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  useEffect(() => {
    if (open) {
      setPhase("form");
      setStep(0);
      setError("");
      setCreated(null);
    }
  }, [open]);

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const analyse = () => {
    if (form.description.trim().length < 5 && !form.type) {
      setError("Veuillez compléter les informations nécessaires.");
      return;
    }
    setError("");
    setPhase("analysing");
    setStep(0);
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = STEPS.map((_, i) =>
      window.setTimeout(() => {
        if (i < STEPS.length - 1) setStep(i + 1);
        else setPhase("result");
      }, 700 * (i + 1)),
    );
  };

  const resolved = {
    type: form.type || guessType(form.description) || "À qualifier",
    brand: form.brand || guessBrand(form.description) || "Non renseignée",
    machine: form.machine || "Non renseignée",
    sector: form.sector || "Non renseigné",
    partRef: form.partRef || "Non renseignée",
  };

  const submit = () => {
    setPhase("sending");
    window.setTimeout(() => {
      const req: PartRequest = {
        reference: `RD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString(),
        description: form.description.trim() || "Demande de pièce industrielle",
        type: resolved.type,
        brand: resolved.brand,
        partRef: resolved.partRef,
        machine: resolved.machine,
        sector: resolved.sector,
        status: "Demande reçue",
        hasPhoto: Boolean(photo),
      };
      addRequest(req);
      setCreated(req);
      setPhase("done");
      toast.success("Demande enregistrée", { description: `Référence ${req.reference}` });
    }, 1400);
  };

  const reset = () => {
    setForm({ ...EMPTY });
    setPhoto(null);
    setPhase("form");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0 sm:rounded-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Recherche de pièce assistée par IA</DialogTitle>
          <DialogDescription>
            Décrivez votre besoin et notre assistant vous aidera à préciser votre demande.
          </DialogDescription>
        </DialogHeader>
        <div className="relative overflow-hidden border-b border-border px-6 py-5 surface-steel">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border-2 border-primary/30 border-dashed" />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-kicker">Agent Service Client IA</p>
              <h2 className="mt-1 pr-8 text-xl font-bold sm:text-2xl">
                Recherche de pièce assistée par IA
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Décrivez votre besoin et notre assistant vous aidera à préciser votre demande.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          {phase === "form" && (
            <div className="space-y-5 animate-rise">
              <div className="space-y-2">
                <Label htmlFor="ai-desc">Description</Label>
                <Textarea
                  id="ai-desc"
                  rows={4}
                  placeholder="Décrivez la pièce recherchée..."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Exemple : Je cherche un roulement SKF pour une machine industrielle.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type de pièce</Label>
                  <Select value={form.type} onValueChange={(v) => set("type", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {PART_TYPES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Secteur</Label>
                  <Select value={form.sector} onValueChange={(v) => set("sector", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-brand">Marque</Label>
                  <Input
                    id="ai-brand"
                    value={form.brand}
                    onChange={(e) => set("brand", e.target.value)}
                    placeholder="SKF, Norton, Mahle..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-ref">Référence</Label>
                  <Input
                    id="ai-ref"
                    value={form.partRef}
                    onChange={(e) => set("partRef", e.target.value)}
                    placeholder="6205-2RS"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ai-machine">Machine / équipement</Label>
                  <Input
                    id="ai-machine"
                    value={form.machine}
                    onChange={(e) => set("machine", e.target.value)}
                    placeholder="Convoyeur, compresseur, pompe..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Photo</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setPhoto(String(reader.result));
                    reader.readAsDataURL(file);
                  }}
                />
                {photo ? (
                  <div className="flex items-center gap-4 rounded-md border border-border p-3">
                    <img
                      src={photo}
                      alt="Aperçu de la pièce"
                      className="size-20 rounded object-cover"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPhoto(null);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                    >
                      <Trash2 className="size-4" /> Supprimer
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => fileRef.current?.click()}>
                    <ImagePlus className="size-4" /> Ajouter une photo
                  </Button>
                )}
              </div>

              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button size="lg" className="w-full" onClick={analyse}>
                <Sparkles className="size-4" /> Analyser ma demande
              </Button>
            </div>
          )}

          {phase === "analysing" && (
            <div className="py-6">
              <div className="mx-auto flex size-24 items-center justify-center rounded-full border border-primary/30">
                <span className="absolute size-24 rounded-full border border-primary/40 animate-pulse-ring" />
                <Bot className="size-9 text-primary" />
              </div>
              <ul className="mx-auto mt-8 max-w-md space-y-3">
                {STEPS.map((s, i) => (
                  <li
                    key={s}
                    className={`flex items-center gap-3 text-sm transition-opacity ${
                      i <= step ? "opacity-100" : "opacity-40"
                    }`}
                  >
                    {i < step ? (
                      <Check className="size-4 text-success" />
                    ) : i === step ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                      <span className="size-4 rounded-full border border-border" />
                    )}
                    {s}
                  </li>
                ))}
              </ul>
              <div className="mx-auto mt-8 h-1 max-w-md overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {phase === "result" && (
            <div className="space-y-6 animate-rise">
              <div>
                <h3 className="text-lg font-bold">Demande analysée</h3>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Type", resolved.type],
                    ["Marque", resolved.brand],
                    ["Application", resolved.machine],
                    ["Secteur", resolved.sector],
                    ["Référence", resolved.partRef],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-md border border-border bg-card px-4 py-3">
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{k}</dt>
                      <dd className="mt-1 font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-4">
                <h4 className="font-display font-bold">Informations à compléter</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pour identifier précisément la pièce, nous vous recommandons d'ajouter la
                  référence, les dimensions ou une photo de la pièce.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" className="flex-1" onClick={() => setPhase("form")}>
                  Modifier ma demande
                </Button>
                <Button className="flex-1" onClick={submit}>
                  Envoyer ma demande
                </Button>
              </div>
            </div>
          )}

          {phase === "sending" && (
            <div className="flex flex-col items-center gap-4 py-16">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Transmission de votre demande...</p>
            </div>
          )}

          {phase === "done" && created && (
            <div className="space-y-6 py-4 text-center animate-rise">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15">
                <Check className="size-8 text-success" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Demande enregistrée</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Votre demande a bien été enregistrée dans cet espace de démonstration.
                </p>
              </div>
              <div className="mx-auto max-w-sm space-y-2 rounded-md border border-border bg-card px-5 py-4 text-left text-sm">
                <p className="font-display text-lg font-bold text-primary">{created.reference}</p>
                <p>Type : {created.type}</p>
                <p>Marque : {created.brand}</p>
                <p>Statut : {created.status}</p>
              </div>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button variant="outline" onClick={reset}>
                  Nouvelle demande
                </Button>
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    reset();
                  }}
                >
                  Retour au Service Client
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
