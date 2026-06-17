"use client";

import { useMemo, useState } from "react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Crown, Radar as RadarIcon, Trophy } from "lucide-react";
import type { AIModel } from "@/lib/types";
import { Badge, Card, CardContent, CardHeader, CardTitle, ScoreBar, SectionHeading } from "@/components/ui/primitives";
import { ModelMultiSelect } from "@/components/ModelMultiSelect";
import { BENCHMARK_AXES, CHART_COLORS, vendorColor } from "@/lib/constants";
import { capabilityScore, cn } from "@/lib/utils";

const DIMENSIONS = [
  { key: "reasoning", label: "Reasoning" },
  { key: "coding", label: "Coding" },
  { key: "math", label: "Math" },
  { key: "multilingual", label: "Multilingual" },
  { key: "vision", label: "Vision" },
] as const;

function topStrength(m: AIModel): string {
  const entries: [string, number][] = [
    ["Reasoning", m.benchmarks.reasoning],
    ["Coding", m.benchmarks.coding],
    ["Math", m.benchmarks.math],
    ["Multilingual", m.benchmarks.multilingual],
    ["Vision", m.benchmarks.vision],
  ];
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

export function Benchmarks({ models }: { models: AIModel[] }) {
  const [selected, setSelected] = useState<string[]>(() =>
    [...models]
      .sort(
        (a, b) =>
          (a.overallRank ?? 99) - (b.overallRank ?? 99) || capabilityScore(b) - capabilityScore(a),
      )
      .slice(0, 3)
      .map((m) => m.id),
  );

  const chosen = useMemo(
    () => selected.map((id) => models.find((m) => m.id === id)).filter((m): m is AIModel => !!m),
    [selected, models],
  );

  const radarData = useMemo(
    () =>
      BENCHMARK_AXES.map((axis) => {
        const row: Record<string, string | number> = { axis: axis.label };
        chosen.forEach((m) => {
          row[m.id] = m.benchmarks[axis.key];
        });
        return row;
      }),
    [chosen],
  );

  const overallLeaders = useMemo(() => {
    const ranked = models.filter((m) => typeof m.overallRank === "number");
    if (ranked.length >= 3) {
      return [...ranked]
        .sort((a, b) => (a.overallRank as number) - (b.overallRank as number))
        .slice(0, 8)
        .map((m) => ({ model: m, rank: m.overallRank as number, strength: m.benchmarkStrength ?? topStrength(m) }));
    }
    return [...models]
      .sort((a, b) => capabilityScore(b) - capabilityScore(a))
      .slice(0, 8)
      .map((m, i) => ({ model: m, rank: i + 1, strength: m.benchmarkStrength ?? topStrength(m) }));
  }, [models]);

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={RadarIcon}
        title="Benchmark Leaders"
        description="Normalized 0–100 scores across reasoning, coding, math, multilingual and vision. Overall and per-dimension leaders, plus a radar to compare models head-to-head."
      />

      {/* Overall leaders */}
      <Card>
        <CardHeader className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-brand" /> Overall benchmark ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {overallLeaders.map(({ model, rank, strength }) => (
              <div
                key={model.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3",
                  rank <= 3 ? "border-brand/40 bg-brand-subtle/40" : "border-border bg-muted/30",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    rank === 1 ? "bg-brand text-brand-foreground" : rank <= 3 ? "bg-brand-muted text-brand" : "bg-muted text-muted-foreground",
                  )}
                >
                  {rank}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: vendorColor(model.vendor) }} />
                    {model.name}
                  </p>
                  {strength ? <Badge tone="outline" className="mt-1">{strength}</Badge> : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leaders per dimension */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {DIMENSIONS.map((dim) => {
          const ranked = [...models]
            .filter((m) => m.benchmarks[dim.key] > 0)
            .sort((a, b) => b.benchmarks[dim.key] - a.benchmarks[dim.key])
            .slice(0, 5);
          return (
            <Card key={dim.key}>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-brand" /> {dim.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {ranked.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="w-4 shrink-0 text-xs font-semibold text-muted-foreground tnum">{i + 1}</span>
                    <span className="flex w-32 shrink-0 items-center gap-1.5 truncate text-sm">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: vendorColor(m.vendor) }} />
                      <span className="truncate text-foreground">{m.name}</span>
                    </span>
                    <ScoreBar value={m.benchmarks[dim.key]} className="flex-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Radar comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Head-to-head radar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ModelMultiSelect models={models} selected={selected} onChange={setSelected} max={4} min={1} />
          {chosen.length > 0 ? (
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                  />
                  {chosen.map((m, i) => (
                    <Radar
                      key={m.id}
                      name={m.name}
                      dataKey={m.id}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      fillOpacity={0.18}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "hsl(var(--popover-foreground))",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Select at least one model to chart.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
