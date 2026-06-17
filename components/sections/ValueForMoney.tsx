"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Gauge } from "lucide-react";
import type { AIModel } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, ScoreBar, SectionHeading } from "@/components/ui/primitives";
import { vendorColor } from "@/lib/constants";
import { blendedCostPer1M, capabilityScore, formatPricePer1M, valueScore } from "@/lib/utils";

export function ValueForMoney({ models }: { models: AIModel[] }) {
  const ranked = useMemo(() => {
    const withValue = models.map((m) => ({ model: m, value: valueScore(m) }));
    const max = Math.max(...withValue.map((w) => w.value));
    return withValue
      .map((w) => ({ ...w, index: (w.value / max) * 100 }))
      .sort((a, b) => b.value - a.value);
  }, [models]);

  const scatterData = useMemo(
    () =>
      models.map((m) => ({
        x: Number(blendedCostPer1M(m).toFixed(3)),
        y: Number(capabilityScore(m).toFixed(1)),
        z: 100,
        name: m.name,
        vendor: m.vendor,
      })),
    [models],
  );

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={Gauge}
        title="Value for Money"
        description="Capability score plotted against blended cost. Models toward the upper-left deliver the most performance per dollar."
      />

      <Card>
        <CardHeader>
          <CardTitle>Capability vs. cost (blended $/1M, log scale)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 16, right: 24, bottom: 28, left: 4 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Blended cost"
                  scale="log"
                  domain={[0.05, 100]}
                  ticks={[0.1, 0.3, 1, 3, 10, 30, 100]}
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  stroke="hsl(var(--border))"
                  label={{ value: "Blended cost per 1M (log)", position: "insideBottom", offset: -14, fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Capability"
                  domain={[60, 100]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  stroke="hsl(var(--border))"
                  label={{ value: "Capability score", angle: -90, position: "insideLeft", fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <ZAxis type="number" dataKey="z" range={[60, 60]} />
                <Tooltip content={<ValueTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={scatterData}>
                  {scatterData.map((d) => (
                    <Cell key={d.name} fill={vendorColor(d.vendor)} fillOpacity={0.85} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Capability = average of reasoning, coding, math and multilingual scores. Cheaper + higher = better value.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Best value, ranked</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">Model</th>
                <th className="px-4 py-2.5 text-right font-medium">Capability</th>
                <th className="px-4 py-2.5 text-right font-medium">Blended /1M</th>
                <th className="px-4 py-2.5 font-medium">Value index</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => (
                <tr key={r.model.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5 tnum text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: vendorColor(r.model.vendor) }} />
                      <span className="font-medium text-foreground">{r.model.name}</span>
                      <span className="text-xs text-muted-foreground">{r.model.vendor}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tnum text-foreground">{Math.round(capabilityScore(r.model))}</td>
                  <td className="px-4 py-2.5 text-right tnum text-muted-foreground">
                    {formatPricePer1M(blendedCostPer1M(r.model))}
                  </td>
                  <td className="px-4 py-2.5">
                    <ScoreBar value={r.index} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

interface TooltipPayload {
  payload: { name: string; vendor: string; x: number; y: number };
}

function ValueTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-card-lg">
      <p className="font-semibold">{d.name}</p>
      <p className="text-muted-foreground">{d.vendor}</p>
      <p className="mt-1 tnum">Capability: {d.y}</p>
      <p className="tnum">Blended: {formatPricePer1M(d.x)}/1M</p>
    </div>
  );
}
