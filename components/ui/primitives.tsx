import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────── Card ──────────────────────────── */

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("card-surface", className)}>{children}</div>;
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("border-b border-border px-5 py-4", className)}>{children}</div>;
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3 className={cn("text-sm font-semibold tracking-tight text-foreground", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("mt-1 text-xs text-muted-foreground", className)}>{children}</p>;
}

export function CardContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

/* ─────────────────────────────── Badge ──────────────────────────── */

export type Tone = "brand" | "success" | "warning" | "danger" | "info" | "muted" | "outline";

const TONE_CLASSES: Record<Tone, string> = {
  brand: "bg-brand-subtle text-brand border border-transparent",
  success: "bg-success/12 text-success border border-transparent",
  warning: "bg-warning/15 text-warning border border-transparent",
  danger: "bg-danger/12 text-danger border border-transparent",
  info: "bg-info/12 text-info border border-transparent",
  muted: "bg-muted text-muted-foreground border border-transparent",
  outline: "bg-transparent text-foreground border border-border",
};

export function Badge({
  tone = "muted",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium leading-5",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────── Boolean cell ───────────────────────── */

export function BoolCell({ value, label }: { value: boolean; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        value ? "text-brand" : "text-muted-foreground/40",
      )}
      aria-label={label ? `${label}: ${value ? "yes" : "no"}` : value ? "yes" : "no"}
      title={value ? "Yes" : "No"}
    >
      {value ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Minus className="h-4 w-4" />}
    </span>
  );
}

/* ───────────────────────────── Mini bar ─────────────────────────── */

export function ScoreBar({
  value,
  max = 100,
  className,
  colorVar = "var(--brand)",
}: {
  value: number;
  max?: number;
  className?: string;
  colorVar?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, backgroundColor: `hsl(${colorVar})` }}
        />
      </div>
      <span className="tnum w-8 shrink-0 text-right text-xs text-muted-foreground">
        {Math.round(value)}
      </span>
    </div>
  );
}

/* ─────────────────────────── Section heading ────────────────────── */

export function SectionHeading({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
