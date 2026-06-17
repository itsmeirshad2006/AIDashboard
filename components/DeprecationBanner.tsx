"use client";

import { AlarmClock, ArrowRight } from "lucide-react";
import type { AIModel } from "@/lib/types";
import { cn, daysUntil, deprecatingSoon, formatDate } from "@/lib/utils";

export function DeprecationBanner({
  models,
  now,
  windowDays = 90,
  onNavigate,
  className,
}: {
  models: AIModel[];
  now: Date;
  windowDays?: number;
  onNavigate?: () => void;
  className?: string;
}) {
  const soon = deprecatingSoon(models, now, windowDays);
  if (soon.length === 0) return null;

  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-warning/40 bg-warning/10 p-4",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-warning/20 text-warning">
            <AlarmClock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {soon.length} model{soon.length > 1 ? "s" : ""} deprecating within {windowDays} days
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Plan migrations now to avoid disruption.
            </p>
          </div>
        </div>
        {onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-md border border-warning/40 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-warning/10 sm:self-auto"
          >
            View lifecycle <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {soon.map((m) => {
          const d = daysUntil(m.deprecationDate, now) ?? 0;
          return (
            <span
              key={m.id}
              className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-card px-3 py-1 text-xs"
            >
              <span className="font-medium text-foreground">{m.name}</span>
              <span className="text-muted-foreground">{formatDate(m.deprecationDate)}</span>
              <span className="rounded-full bg-warning/20 px-1.5 py-0.5 font-semibold text-warning tnum">
                {d}d
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
