"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calculator } from "lucide-react";
import type { AIModel } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, SectionHeading } from "@/components/ui/primitives";
import { vendorColor } from "@/lib/constants";
import { cn, formatTokens, formatUSD, hasApiPricing, monthlyCost } from "@/lib/utils";

const PRESETS = [
  { label: "Prototype", input: 5, output: 1 },
  { label: "Growth", input: 50, output: 10 },
  { label: "Scale", input: 500, output: 100 },
  { label: "Enterprise", input: 2000, output: 400 },
];

export function CostCalculator({ models }: { models: AIModel[] }) {
  const [input, setInput] = useState(50);
  const [output, setOutput] = useState(10);
  const [batch, setBatch] = useState(false);

  const meteredModels = useMemo(() => models.filter(hasApiPricing), [models]);
  const selfHostedCount = models.length - meteredModels.length;

  const ranked = useMemo(() => {
    return meteredModels
      .map((m) => ({ model: m, cost: monthlyCost(m, input, output, batch) }))
      .sort((a, b) => a.cost - b.cost);
  }, [meteredModels, input, output, batch]);

  const cheapest = ranked[0];
  const chartData = ranked.slice(0, 12).map((r) => ({
    name: r.model.name,
    cost: Number(r.cost.toFixed(2)),
    vendor: r.model.vendor,
  }));

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={Calculator}
        title="Cost Calculator"
        description="Enter your expected monthly token volume to estimate spend per model, ranked cheapest first."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Controls */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Monthly usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NumberField
              label="Input tokens / month"
              suffix="M"
              value={input}
              onChange={setInput}
              hint={`${formatTokens(input * 1_000_000)} tokens`}
            />
            <NumberField
              label="Output tokens / month"
              suffix="M"
              value={output}
              onChange={setOutput}
              hint={`${formatTokens(output * 1_000_000)} tokens`}
            />

            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Quick presets</p>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setInput(p.input);
                      setOutput(p.output);
                    }}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                      input === p.input && output === p.output
                        ? "border-brand bg-brand-subtle text-brand"
                        : "border-border text-muted-foreground hover:border-brand/40 hover:text-foreground",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={batch}
                onChange={(e) => setBatch(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-brand"
              />
              Apply batch discount where available
            </label>

            {cheapest ? (
              <div className="rounded-lg border border-brand/30 bg-brand-subtle/50 p-3">
                <p className="text-xs text-muted-foreground">Cheapest option</p>
                <p className="text-sm font-semibold text-foreground">{cheapest.model.name}</p>
                <p className="text-lg font-bold text-brand tnum">{formatUSD(cheapest.cost)}/mo</p>
              </div>
            ) : null}

            {selfHostedCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                {selfHostedCount} self-hosted open-weights model{selfHostedCount > 1 ? "s are" : " is"} excluded —
                no per-token API fee (you pay for compute).
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Estimated monthly cost — 12 cheapest</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 56, top: 4, bottom: 4 }}>
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
                    formatter={(v) => [formatUSD(Number(v)), "Monthly cost"]}
                  />
                  <Bar dataKey="cost" radius={[0, 4, 4, 0]} barSize={18}>
                    {chartData.map((d) => (
                      <Cell key={d.name} fill={vendorColor(d.vendor)} />
                    ))}
                    <LabelList
                      dataKey="cost"
                      position="right"
                      formatter={(v: number) => formatUSD(v)}
                      style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full ranked table */}
      <Card>
        <CardHeader>
          <CardTitle>All models ranked by estimated monthly cost</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">Model</th>
                <th className="px-4 py-2.5 font-medium">Vendor</th>
                <th className="px-4 py-2.5 text-right font-medium">Input cost</th>
                <th className="px-4 py-2.5 text-right font-medium">Output cost</th>
                <th className="px-4 py-2.5 text-right font-medium">Monthly total</th>
                <th className="px-4 py-2.5 text-right font-medium">vs cheapest</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => {
                const inputCost = monthlyCost(r.model, input, 0, batch);
                const outputCost = monthlyCost(r.model, 0, output, batch);
                const delta = r.cost - cheapest.cost;
                return (
                  <tr key={r.model.id} className={cn("border-b border-border/50 last:border-0 hover:bg-muted/30", i === 0 && "bg-brand-subtle/40")}>
                    <td className="px-4 py-2.5 tnum text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-foreground">{r.model.name}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: vendorColor(r.model.vendor) }} />
                        {r.model.vendor}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tnum text-muted-foreground">{formatUSD(inputCost)}</td>
                    <td className="px-4 py-2.5 text-right tnum text-muted-foreground">{formatUSD(outputCost)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tnum text-foreground">{formatUSD(r.cost)}</td>
                    <td className="px-4 py-2.5 text-right tnum text-muted-foreground">
                      {i === 0 ? "—" : `+${formatUSD(delta)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm tnum focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring"
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
