"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award } from "lucide-react";
import type { AIModel } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, SectionHeading } from "@/components/ui/primitives";
import { vendorColor } from "@/lib/constants";
import { cn, formatCompact, formatInt } from "@/lib/utils";

type MetricKey = "latency" | "throughput" | "rpm" | "tpm";

const METRICS: Record<
  MetricKey,
  { label: string; get: (m: AIModel) => number; better: "higher" | "lower"; fmt: (n: number) => string }
> = {
  latency: { label: "Avg latency (ms)", get: (m) => m.latencyMsAvg, better: "lower", fmt: (n) => `${formatInt(n)}ms` },
  throughput: { label: "Throughput (tok/s)", get: (m) => m.throughputTokensPerSec, better: "higher", fmt: (n) => formatInt(n) },
  rpm: { label: "Rate limit — RPM", get: (m) => m.rateLimits.rpm, better: "higher", fmt: (n) => formatCompact(n) },
  tpm: { label: "Rate limit — TPM", get: (m) => m.rateLimits.tpm, better: "higher", fmt: (n) => formatCompact(n) },
};

export function Performance({ models }: { models: AIModel[] }) {
  const [metric, setMetric] = useState<MetricKey>("latency");
  const cfg = METRICS[metric];

  const chartData = useMemo(() => {
    const sorted = [...models].sort((a, b) => (cfg.better === "lower" ? cfg.get(a) - cfg.get(b) : cfg.get(b) - cfg.get(a)));
    return sorted.slice(0, 12).map((m) => ({ name: m.name, value: cfg.get(m), vendor: m.vendor }));
  }, [models, cfg]);

  const table = useMemo(
    () => [...models].sort((a, b) => a.latencyMsAvg - b.latencyMsAvg),
    [models],
  );

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={Award}
        title="Performance & Limits"
        description="Representative latency, streaming throughput and default-tier rate limits. Actual numbers vary by region, tier and load."
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{cfg.label} — top 12</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(METRICS) as MetricKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setMetric(k)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                  metric === k
                    ? "border-brand bg-brand-subtle text-brand"
                    : "border-border text-muted-foreground hover:border-brand/40 hover:text-foreground",
                )}
              >
                {METRICS[k].label.split(" ")[0].replace("Rate", "Limit")}
                {k === "rpm" ? " RPM" : k === "tpm" ? " TPM" : ""}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 64, top: 4, bottom: 4 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={132}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "hsl(var(--popover-foreground))",
                  }}
                  formatter={(v) => [cfg.fmt(Number(v)), cfg.label]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                  {chartData.map((d) => (
                    <Cell key={d.name} fill={vendorColor(d.vendor)} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(v: number) => cfg.fmt(v)}
                    style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {cfg.better === "lower" ? "Lower is better." : "Higher is better."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All models — performance & limits</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Model</th>
                <th className="px-4 py-2.5 text-right font-medium">Latency</th>
                <th className="px-4 py-2.5 text-right font-medium">Throughput</th>
                <th className="px-4 py-2.5 text-right font-medium">RPM</th>
                <th className="px-4 py-2.5 text-right font-medium">TPM</th>
              </tr>
            </thead>
            <tbody>
              {table.map((m) => (
                <tr key={m.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: vendorColor(m.vendor) }} />
                      <span className="font-medium text-foreground">{m.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tnum text-muted-foreground">{formatInt(m.latencyMsAvg)}ms</td>
                  <td className="px-4 py-2.5 text-right tnum text-muted-foreground">{formatInt(m.throughputTokensPerSec)} tok/s</td>
                  <td className="px-4 py-2.5 text-right tnum text-muted-foreground">{formatCompact(m.rateLimits.rpm)}</td>
                  <td className="px-4 py-2.5 text-right tnum text-muted-foreground">{formatCompact(m.rateLimits.tpm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
