import { useEffect, useRef } from "react";

function Gear({ teeth = 12, r = 100 }: { teeth?: number; r?: number }) {
  const paths = Array.from({ length: teeth }, (_, i) => {
    const a = (i / teeth) * Math.PI * 2;
    const x1 = Math.cos(a) * r;
    const y1 = Math.sin(a) * r;
    const x2 = Math.cos(a) * (r + 16);
    const y2 = Math.sin(a) * (r + 16);
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="6" strokeLinecap="round" />;
  });
  return (
    <g stroke="currentColor" fill="none">
      <circle r={r} strokeWidth="5" />
      <circle r={r * 0.55} strokeWidth="3" />
      <circle r={r * 0.2} strokeWidth="3" />
      {paths}
    </g>
  );
}

/** "Industrial Motion" — gears, bearing rings, belts and blueprint grid. */
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
        const x = (e.clientX / window.innerWidth - 0.5) * 24;
        const y = (e.clientY / window.innerHeight - 0.5) * 24;
        el.style.setProperty("--px", `${x}px`);
        el.style.setProperty("--py", `${y}px`);
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ opacity: 0.55 * intensity }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--color-steel) 22%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--color-steel) 22%, transparent) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(120% 90% at 50% 0%, black 25%, transparent 85%)",
        }}
      />
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{ transform: "translate3d(var(--px, 0px), var(--py, 0px), 0)" }}
      >
        <svg
          className="absolute -top-28 -left-24 h-[420px] w-[420px] text-graphite/20"
          viewBox="-140 -140 280 280"
        >
          <g style={{ animation: "rd-spin-slow 48s linear infinite", transformOrigin: "center" }}>
            <Gear teeth={16} r={110} />
          </g>
        </svg>
        <svg
          className="absolute top-1/3 -right-32 h-[520px] w-[520px] text-primary/15"
          viewBox="-140 -140 280 280"
        >
          <g style={{ animation: "rd-spin-reverse 64s linear infinite", transformOrigin: "center" }}>
            <Gear teeth={22} r={118} />
          </g>
        </svg>
        <svg
          className="absolute bottom-[-120px] left-1/3 h-[380px] w-[380px] text-steel/25"
          viewBox="-140 -140 280 280"
        >
          <g style={{ animation: "rd-spin-slow 80s linear infinite", transformOrigin: "center" }}>
            <circle r="120" fill="none" stroke="currentColor" strokeWidth="4" />
            <circle
              r="96"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray="6 22"
            />
            <circle r="60" fill="none" stroke="currentColor" strokeWidth="4" />
          </g>
        </svg>
        <svg className="absolute inset-0 h-full w-full text-primary/35" preserveAspectRatio="none">
          <path
            d="M-50 220 C 320 120, 620 380, 1100 200 S 1700 320, 2200 180"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="14 12"
            style={{ animation: "rd-belt 14s linear infinite" }}
          />
          <path
            d="M-50 620 C 400 520, 700 760, 1200 600 S 1800 700, 2300 560"
            fill="none"
            stroke="color-mix(in oklab, var(--color-steel) 60%, transparent)"
            strokeWidth="1"
            strokeDasharray="10 16"
            style={{ animation: "rd-belt 22s linear infinite" }}
          />
        </svg>
      </div>
    </div>
  );
}
