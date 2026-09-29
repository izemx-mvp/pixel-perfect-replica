import { cn } from "@/lib/utils";

/** Rousseau Distribution wordmark with its characteristic red underline. */
export function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const scale = {
    sm: { main: "text-base", sub: "text-[0.5rem]", bar: "h-[2px]" },
    md: { main: "text-xl", sub: "text-[0.6rem]", bar: "h-[3px]" },
    lg: { main: "text-4xl sm:text-5xl", sub: "text-xs sm:text-sm", bar: "h-[5px]" },
  }[size];

  return (
    <span className={cn("inline-flex select-none flex-col leading-none", className)}>
      <span
        className={cn("font-display font-extrabold tracking-[0.02em] text-foreground", scale.main)}
      >
        ROUSSEAU
      </span>
      <span
        className={cn("mt-1 w-full rounded-full bg-primary", scale.bar)}
        style={{ backgroundImage: "var(--gradient-red)" }}
      />
      <span
        className={cn(
          "mt-1 font-display font-semibold uppercase tracking-[0.34em] text-muted-foreground",
          scale.sub,
        )}
      >
        Distribution
      </span>
    </span>
  );
}
