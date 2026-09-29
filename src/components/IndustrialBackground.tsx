import { useEffect, useRef } from "react";

/** Build a real gear outline (trapezoidal teeth) as an SVG path. */
function gearPath(teeth: number, r: number, depth: number) {
  const pts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const seq = [
      [a, r],
      [a + step * 0.12, r + depth],
      [a + step * 0.42, r + depth],
      [a + step * 0.54, r],
    ] as const;
    seq.forEach(([ang, rad]) => pts.push(`${(Math.cos(ang) * rad).toFixed(2)},${(Math.sin(ang) * rad).toFixed(2)}`));
  }
  return `M${pts.join("L")}Z`;
}

function MetalGear({ teeth, r, id, spokes = 5 }: { teeth: number; r: number; id: string; spokes?: number }) {
  const depth = r * 0.14;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-body`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="oklch(0.92 0.005 250)" />
          <stop offset="45%" stopColor="oklch(0.62 0.01 250)" />
          <stop offset="100%" stopColor="oklch(0.3 0.01 250)" />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.95 0 0)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="oklch(0.2 0 0)" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* drop shadow for depth */}
      <path d={gearPath(teeth, r, depth)} transform="translate(6 8)" fill="oklch(0 0 0 / 0.35)" />
      <path d={gearPath(teeth, r, depth)} fill={`url(#${id}-body)`} stroke={`url(#${id}-rim)`} strokeWidth="2" />
      <circle r={r * 0.78} fill="none" stroke="oklch(0.25 0.01 250 / 0.6)" strokeWidth={r * 0.05} />
      {Array.from({ length: spokes }, (_, i) => {
        const a = (i / spokes) * Math.PI * 2;
        return (
          <path
            key={i}
            d={`M0 0 L${Math.cos(a - 0.28) * r * 0.66} ${Math.sin(a - 0.28) * r * 0.66} A ${r * 0.66} ${r * 0.66} 0 0 1 ${Math.cos(a + 0.28) * r * 0.66} ${Math.sin(a + 0.28) * r * 0.66} Z`}
            fill="oklch(0.18 0.01 250 / 0.55)"
          />
        );
      })}
      <circle r={r * 0.3} fill={`url(#${id}-body)`} stroke="oklch(0.2 0 0 / 0.6)" strokeWidth="2" />
      <circle r={r * 0.12} fill="oklch(0.15 0.01 250)" />
    </g>
  );
}

type G = { id: string; x: string; y: string; size: number; teeth: number; dur: number; rev?: boolean; depth: number; red?: boolean };
// Gears placed so neighbours visually mesh and rotate in opposite directions.
const GEARS: G[] = [
  { id: "g1", x: "-6%", y: "-10%", size: 460, teeth: 24, dur: 90, depth: 0.6 },
  { id: "g2", x: "18%", y: "12%", size: 230, teeth: 12, dur: 45, rev: true, depth: 0.6 },
  { id: "g3", x: "78%", y: "18%", size: 560, teeth: 30, dur: 120, depth: 1 },
  { id: "g4", x: "70%", y: "62%", size: 260, teeth: 14, dur: 56, rev: true, depth: 1, red: true },
  { id: "g5", x: "30%", y: "78%", size: 380, teeth: 20, dur: 80, depth: 1.4 },
  { id: "g6", x: "48%", y: "70%", size: 170, teeth: 9, dur: 36, rev: true, depth: 1.4 },
  { id: "g7", x: "-4%", y: "60%", size: 300, teeth: 16, dur: 64, rev: true, depth: 0.8 },
];

/** "Industrial Motion" — layered metallic interlocking gears with parallax. */
export function IndustrialBackground({ intensity = 1 }: { intensity?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(max-width: 768px)").matches) return;
    let frame = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--px", `${(e.clientX / window.innerWidth - 0.5) * 20}px`);
        el.style.setProperty("--py", `${(e.clientY / window.innerHeight - 0.5) * 20}px`);
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "var(--gradient-metal-bg, transparent)" }} />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--color-steel) 16%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--color-steel) 16%, transparent) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(120% 90% at 50% 0%, black 25%, transparent 85%)",
        }}
      />
      <div className="absolute inset-0" style={{ opacity: 0.16 * intensity }}>
        {GEARS.map((g) => (
          <div
            key={g.id}
            className="absolute transition-transform duration-500 ease-out max-md:hidden [&:nth-child(-n+3)]:max-md:block"
            style={{
              left: g.x,
              top: g.y,
              width: g.size,
              height: g.size,
              transform: `translate3d(calc(var(--px, 0px) * ${g.depth}), calc(var(--py, 0px) * ${g.depth}), 0)`,
              filter: g.red ? "sepia(1) saturate(4) hue-rotate(-30deg) brightness(0.8)" : undefined,
            }}
          >
            <svg viewBox="-130 -130 260 260" className="size-full">
              <g style={{ animation: `${g.rev ? "rd-spin-reverse" : "rd-spin-slow"} ${g.dur}s linear infinite`, transformOrigin: "center", transformBox: "fill-box" }}>
                <MetalGear teeth={g.teeth} r={100} id={g.id} />
              </g>
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}
