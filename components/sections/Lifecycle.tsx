"use client";

import { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import type { AIModel } from "@/lib/types";
import { Card, SectionHeading } from "@/components/ui/primitives";
import { DeprecationBanner } from "@/components/DeprecationBanner";
import { cn, daysUntil, formatDate } from "@/lib/utils";

const DAY = 86_400_000;
const toTs = (iso: string) => new Date(iso + "T00:00:00").getTime();

const STATUS_BAR: Record<string, string> = {
  Active: "bg-brand",
  Preview: "bg-info",
  Deprecated: "bg-warning",
  Retired: "bg-danger",
};

export function Lifecycle({ models, now }: { models: AIModel[]; now: Date }) {
  const nowTs = now.getTime();

  const { sorted, minTs, span, years } = useMemo(() => {
    const releases = models.map((m) => toTs(m.releaseDate));
    const deps = models.filter((m) => m.deprecationDate).map((m) => toTs(m.deprecationDate as string));
    const minTs = Math.min(...releases);
    const maxTs = Math.max(nowTs + 180 * DAY, ...(deps.length ? deps : [nowTs]));
    const span = maxTs - minTs || 1;
    const sorted = [...models].sort((a, b) => toTs(a.releaseDate) - toTs(b.releaseDate));

    const startYear = new Date(minTs).getFullYear();
    const endYear = new Date(maxTs).getFullYear();
    const years: { year: number; pct: number }[] = [];
    for (let y = startYear; y <= endYear; y++) {
      const ts = new Date(`${y}-01-01T00:00:00`).getTime();
      if (ts >= minTs && ts <= maxTs) years.push({ year: y, pct: ((ts - minTs) / span) * 100 });
    }
    return { sorted, minTs, span, years };
  }, [models, nowTs]);

  const pct = (ts: number) => ((ts - minTs) / span) * 100;
  const nowPct = pct(nowTs);

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={CalendarClock}
        title="Lifecycle Timeline"
        description="Release-to-retirement span for every model. The dashed line marks today; bars that end are scheduled for retirement."
      />

      <DeprecationBanner models={models} now={now} />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {["Active", "Preview", "Deprecated", "Retired"].map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={cn("h-2.5 w-4 rounded-full", STATUS_BAR[s])} /> {s}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-px bg-foreground/60" /> Today
        </span>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[760px] p-4">
            {/* Year axis */}
            <div className="relative ml-44 h-5 border-b border-border">
              {years.map((y) => (
                <div key={y.year} className="absolute top-0 flex h-full flex-col" style={{ left: `${y.pct}%` }}>
                  <span className="text-[10px] font-medium text-muted-foreground">{y.year}</span>
                </div>
              ))}
            </div>

            {/* Rows */}
            <div className="relative">
              {/* Now line spanning all rows */}
              <div
                className="pointer-events-none absolute bottom-0 top-0 z-10 ml-44 border-l border-dashed border-foreground/50"
                style={{ left: `calc(${nowPct}% )` }}
                aria-hidden
              />
              {sorted.map((m) => {
                const relTs = toTs(m.releaseDate);
                const endTs = m.deprecationDate ? toTs(m.deprecationDate) : minTs + span;
                const left = pct(relTs);
                const width = Math.max(1.5, pct(endTs) - left);
                const d = daysUntil(m.deprecationDate, now);
                const urgent = d !== null && d >= 0 && d <= 90;
                return (
                  <div key={m.id} className="flex items-center gap-0 py-1">
                    <div className="flex w-44 shrink-0 items-center gap-2 pr-3">
                      <span className="truncate text-xs font-medium text-foreground" title={m.name}>
                        {m.name}
                      </span>
                    </div>
                    <div className="relative h-5 flex-1">
                      <div
                        className={cn(
                          "absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full",
                          STATUS_BAR[m.status],
                          !m.deprecationDate && "opacity-80",
                        )}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={`${m.name}: ${formatDate(m.releaseDate)} → ${m.deprecationDate ? formatDate(m.deprecationDate) : "ongoing"}`}
                      >
                        {!m.deprecationDate ? (
                          <span className="absolute right-0 top-0 h-full w-6 rounded-r-full bg-gradient-to-r from-transparent to-background" />
                        ) : null}
                      </div>
                      {urgent ? (
                        <span
                          className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-warning/20 px-1.5 py-0.5 text-[10px] font-semibold text-warning tnum"
                          style={{ left: `calc(${pct(endTs)}% + 6px)` }}
                        >
                          {d}d
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Retirement schedule table */}
      <Card>
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Scheduled retirements</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Model</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Released</th>
                <th className="px-4 py-2.5 font-medium">Retirement</th>
                <th className="px-4 py-2.5 text-right font-medium">Countdown</th>
              </tr>
            </thead>
            <tbody>
              {sorted
                .filter((m) => m.deprecationDate)
                .sort((a, b) => toTs(a.deprecationDate as string) - toTs(b.deprecationDate as string))
                .map((m) => {
                  const d = daysUntil(m.deprecationDate, now)!;
                  const urgent = d >= 0 && d <= 90;
                  return (
                    <tr key={m.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium text-foreground">{m.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{m.status}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{formatDate(m.releaseDate)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{formatDate(m.deprecationDate)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={cn(
                            "tnum font-semibold",
                            d < 0 ? "text-danger" : urgent ? "text-warning" : "text-muted-foreground",
                          )}
                        >
                          {d < 0 ? "Retired" : `${d} days`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              {sorted.filter((m) => m.deprecationDate).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No retirements scheduled.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
