import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

/** Liste persistée en localStorage, initialisée avec des données de départ. */
export function useStored<T>(key: string, seed: T) {
  const [v, setV] = useState<T>(seed);
  useEffect(() => {
    try { const s = localStorage.getItem(key); if (s) setV(JSON.parse(s)); } catch { /* ignore */ }
  }, [key]);
  const set = (n: T) => { setV(n); localStorage.setItem(key, JSON.stringify(n)); };
  const reset = () => { setV(seed); localStorage.removeItem(key); };
  return [v, set, reset] as const;
}

export type Field = { key: string; label: string; type?: "text" | "textarea" | "number" | "select" | "date"; options?: string[]; required?: boolean };

/** Formulaire générique d'ajout / modification. */
export function EditDialog<T extends Record<string, unknown>>({ title, fields, value, onSave, onClose, footer }: {
  title: string; fields: Field[]; value: T; onSave: (v: T) => void; onClose: () => void; footer?: ReactNode;
}) {
  const [f, setF] = useState<T>(value);
  const save = () => {
    const miss = fields.find((x) => x.required && !String(f[x.key] ?? "").trim());
    if (miss) { toast.error(`Veuillez compléter : ${miss.label}`); return; }
    onSave(f);
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          {fields.map((x) => (
            <div key={x.key}>
              <Label>{x.label}{x.required && " *"}</Label>
              {x.type === "textarea" ? (
                <Textarea className="mt-1" rows={4} maxLength={2000} value={String(f[x.key] ?? "")} onChange={(e) => setF({ ...f, [x.key]: e.target.value })} />
              ) : x.type === "select" ? (
                <select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={String(f[x.key] ?? "")} onChange={(e) => setF({ ...f, [x.key]: e.target.value })}>
                  {x.options!.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <Input className="mt-1" type={x.type ?? "text"} maxLength={300} value={String(f[x.key] ?? "")}
                  onChange={(e) => setF({ ...f, [x.key]: x.type === "number" ? Number(e.target.value) : e.target.value })} />
              )}
            </div>
          ))}
        </div>
        {footer}
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={save}>Enregistrer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
