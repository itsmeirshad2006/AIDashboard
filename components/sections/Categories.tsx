"use client";

import { useMemo, useState } from "react";
import { Tags } from "lucide-react";
import type { AIModel, CategoryTag } from "@/lib/types";
import { Badge, Card, SectionHeading } from "@/components/ui/primitives";
import { vendorColor } from "@/lib/constants";
import { cn, formatPricePer1M, formatTokens, STATUS_META } from "@/lib/utils";

const CATEGORY_ORDER: CategoryTag[] = [
  "Frontier",
  "Reasoning",
  "Coding",
  "Multimodal",
  "Long Context",
  "Budget",
  "Fast / Realtime",
  "Open Source",
  "Enterprise",
];

const CATEGORY_BLURB: Record<CategoryTag, string> = {
  Frontier: "Flagship, state-of-the-art models pushing the capability frontier.",
  Reasoning: "Strong multi-step reasoning and chain-of-thought problem solving.",
  Coding: "Best for code generation, refactoring and agentic engineering.",
  Multimodal: "Accept image, audio and/or video alongside text.",
  "Long Context": "Handle very large inputs — 1M+ token context windows.",
  Budget: "Lowest cost per token for high-volume or price-sensitive workloads.",
  "Fast / Realtime": "Low latency and high throughput for interactive apps.",
  "Open Source": "Open or open-weights models you can self-host.",
  Enterprise: "Mature compliance, governance and deployment options.",
};

export function Categories({ models }: { models: AIModel[] }) {
  const counts = useMemo(() => {
    const map = new Map<CategoryTag, AIModel[]>();
    for (const c of CATEGORY_ORDER) map.set(c, []);
    for (const m of models) for (const c of m.categories) map.get(c)?.push(m);
    return map;
  }, [models]);

  const available = CATEGORY_ORDER.filter((c) => (counts.get(c)?.length ?? 0) > 0);
  const [active, setActive] = useState<CategoryTag>(available[0] ?? "Frontier");
  const list = (counts.get(active) ?? []).slice().sort((a, b) => b.benchmarks.coding + b.benchmarks.reasoning - (a.benchmarks.coding + a.benchmarks.reasoning));

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={Tags}
        title="Category Browser"
        description="Browse models grouped by category, each with its standout use cases. Pick a category to see the best options."
      />

      <div className="flex flex-wrap gap-1.5">
        {available.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActive(c)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              active === c
                ? "border-brand bg-brand-subtle text-brand"
                : "border-border bg-background text-muted-foreground hover:border-brand/40 hover:text-foreground",
            )}
          >
            {c}
            <span className="rounded-full bg-muted px-1.5 text-[10px] font-semibold tnum">
              {counts.get(c)?.length ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-brand/20 bg-brand-subtle/40 px-4 py-3">
        <p className="text-sm font-medium text-foreground">{active}</p>
        <p className="text-sm text-muted-foreground">{CATEGORY_BLURB[active]}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((m) => (
          <Card key={m.id} className="flex flex-col p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: vendorColor(m.vendor) }} />
                  {m.name}
                </h3>
                <p className="text-xs text-muted-foreground">{m.vendor}</p>
              </div>
              <Badge tone={STATUS_META[m.status].tone as "success" | "warning" | "danger" | "info"}>
                {m.status}
              </Badge>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Stat label="In /1M" value={formatPricePer1M(m.pricing.inputPer1M)} />
              <Stat label="Out /1M" value={formatPricePer1M(m.pricing.outputPer1M)} />
              <Stat label="Context" value={formatTokens(m.contextWindow)} />
            </div>

            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Best for</p>
            <ul className="mt-1 space-y-1">
              {m.bestUseCases.slice(0, 4).map((u) => (
                <li key={u} className="flex items-start gap-1.5 text-sm text-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                  {u}
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap gap-1">
              {m.categories
                .filter((c) => c !== active)
                .map((c) => (
                  <Badge key={c} tone="muted">
                    {c}
                  </Badge>
                ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/60 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-foreground tnum">{value}</p>
    </div>
  );
}
