"use client";

import { useMemo, useState } from "react";
import { Scale } from "lucide-react";
import type { AIModel } from "@/lib/types";
import { Badge, Card, SectionHeading } from "@/components/ui/primitives";
import { BoolCell } from "@/components/ui/primitives";
import { ModelMultiSelect } from "@/components/ModelMultiSelect";
import { vendorColor } from "@/lib/constants";
import {
  blendedCostPer1M,
  capabilityScore,
  cn,
  formatDate,
  formatInt,
  formatPricePer1M,
  formatTokens,
  STATUS_META,
} from "@/lib/utils";

interface Row {
  group: string;
  label: string;
  render: (m: AIModel) => React.ReactNode;
  num?: (m: AIModel) => number;
  better?: "higher" | "lower";
}

const DEFAULT_SELECTION = ["gpt-4_1", "claude-sonnet-4", "gemini-2-5-pro"];

export function SideBySide({ models }: { models: AIModel[] }) {
  const [selected, setSelected] = useState<string[]>(
    DEFAULT_SELECTION.filter((id) => models.some((m) => m.id === id)),
  );

  const chosen = useMemo(
    () => selected.map((id) => models.find((m) => m.id === id)).filter((m): m is AIModel => !!m),
    [selected, models],
  );

  const rows: Row[] = [
    { group: "Pricing", label: "Input / 1M", render: (m) => formatPricePer1M(m.pricing.inputPer1M), num: (m) => m.pricing.inputPer1M, better: "lower" },
    { group: "Pricing", label: "Output / 1M", render: (m) => formatPricePer1M(m.pricing.outputPer1M), num: (m) => m.pricing.outputPer1M, better: "lower" },
    { group: "Pricing", label: "Blended / 1M", render: (m) => formatPricePer1M(blendedCostPer1M(m)), num: (m) => blendedCostPer1M(m), better: "lower" },
    { group: "Pricing", label: "Cached input / 1M", render: (m) => (m.pricing.cachedInputPer1M != null ? formatPricePer1M(m.pricing.cachedInputPer1M) : "—") },
    { group: "Pricing", label: "Batch discount", render: (m) => (m.pricing.batchDiscount ? `${Math.round(m.pricing.batchDiscount * 100)}%` : "—") },

    { group: "Context", label: "Context window", render: (m) => formatTokens(m.contextWindow), num: (m) => m.contextWindow, better: "higher" },
    { group: "Context", label: "Max output", render: (m) => formatTokens(m.maxOutputTokens), num: (m) => m.maxOutputTokens, better: "higher" },
    { group: "Context", label: "Knowledge cutoff", render: (m) => m.knowledgeCutoff },

    { group: "Modalities", label: "Text", render: (m) => <BoolCell value={m.multimodal.text} /> },
    { group: "Modalities", label: "Image", render: (m) => <BoolCell value={m.multimodal.image} /> },
    { group: "Modalities", label: "Audio", render: (m) => <BoolCell value={m.multimodal.audio} /> },
    { group: "Modalities", label: "Video", render: (m) => <BoolCell value={m.multimodal.video} /> },

    { group: "Capabilities", label: "Function calling", render: (m) => <BoolCell value={m.capabilities.functionCalling} /> },
    { group: "Capabilities", label: "JSON / structured", render: (m) => <BoolCell value={m.capabilities.structuredOutput} /> },
    { group: "Capabilities", label: "Streaming", render: (m) => <BoolCell value={m.capabilities.streaming} /> },
    { group: "Capabilities", label: "Fine-tuning", render: (m) => <BoolCell value={m.capabilities.fineTuning} /> },
    { group: "Capabilities", label: "Reasoning mode", render: (m) => <BoolCell value={m.capabilities.reasoningMode} /> },

    { group: "Deployment", label: "Direct API", render: (m) => <BoolCell value={m.deployment.api} /> },
    { group: "Deployment", label: "Azure", render: (m) => <BoolCell value={m.deployment.azure} /> },
    { group: "Deployment", label: "AWS Bedrock", render: (m) => <BoolCell value={m.deployment.awsBedrock} /> },
    { group: "Deployment", label: "GCP Vertex", render: (m) => <BoolCell value={m.deployment.gcpVertex} /> },
    { group: "Deployment", label: "Self-hostable", render: (m) => <BoolCell value={m.deployment.selfHostable} /> },
    { group: "Deployment", label: "Open source", render: (m) => <BoolCell value={m.openSource} /> },
    { group: "Deployment", label: "License", render: (m) => <span className="text-xs">{m.license}</span> },

    { group: "Benchmarks", label: "Reasoning", render: (m) => m.benchmarks.reasoning, num: (m) => m.benchmarks.reasoning, better: "higher" },
    { group: "Benchmarks", label: "Coding", render: (m) => m.benchmarks.coding, num: (m) => m.benchmarks.coding, better: "higher" },
    { group: "Benchmarks", label: "Math", render: (m) => m.benchmarks.math, num: (m) => m.benchmarks.math, better: "higher" },
    { group: "Benchmarks", label: "Multilingual", render: (m) => m.benchmarks.multilingual, num: (m) => m.benchmarks.multilingual, better: "higher" },
    { group: "Benchmarks", label: "Vision", render: (m) => (m.benchmarks.vision > 0 ? m.benchmarks.vision : "—"), num: (m) => m.benchmarks.vision, better: "higher" },
    { group: "Benchmarks", label: "Capability avg", render: (m) => Math.round(capabilityScore(m)), num: (m) => capabilityScore(m), better: "higher" },

    { group: "Performance", label: "Avg latency", render: (m) => `${formatInt(m.latencyMsAvg)}ms`, num: (m) => m.latencyMsAvg, better: "lower" },
    { group: "Performance", label: "Throughput", render: (m) => `${formatInt(m.throughputTokensPerSec)} tok/s`, num: (m) => m.throughputTokensPerSec, better: "higher" },
    { group: "Performance", label: "Rate limit (RPM)", render: (m) => formatInt(m.rateLimits.rpm), num: (m) => m.rateLimits.rpm, better: "higher" },
    { group: "Performance", label: "Rate limit (TPM)", render: (m) => formatCompactTpm(m.rateLimits.tpm), num: (m) => m.rateLimits.tpm, better: "higher" },

    { group: "Compliance", label: "SOC 2", render: (m) => <BoolCell value={m.compliance.soc2} /> },
    { group: "Compliance", label: "ISO 27001", render: (m) => <BoolCell value={m.compliance.iso27001} /> },
    { group: "Compliance", label: "HIPAA", render: (m) => <BoolCell value={m.compliance.hipaa} /> },
    { group: "Compliance", label: "GDPR", render: (m) => <BoolCell value={m.compliance.gdpr} /> },
    { group: "Compliance", label: "Data residency", render: (m) => <BoolCell value={m.compliance.dataResidency} /> },
    { group: "Compliance", label: "Trains on your data", render: (m) => <BoolCell value={!m.compliance.trainsOnYourData} label="does not train" /> },

    { group: "Lifecycle", label: "Status", render: (m) => <Badge tone={STATUS_META[m.status].tone as "success" | "warning" | "danger" | "info"}>{m.status}</Badge> },
    { group: "Lifecycle", label: "Released", render: (m) => formatDate(m.releaseDate) },
    { group: "Lifecycle", label: "Retirement", render: (m) => formatDate(m.deprecationDate) },
  ];

  function bestId(row: Row): string | null {
    if (!row.num || !row.better || chosen.length < 2) return null;
    const sorted = [...chosen].sort((a, b) => (row.better === "higher" ? row.num!(b) - row.num!(a) : row.num!(a) - row.num!(b)));
    const best = sorted[0];
    // Only highlight if there is a unique winner
    if (row.num(sorted[0]) === row.num(sorted[1])) return null;
    return best.id;
  }

  const groups = Array.from(new Set(rows.map((r) => r.group)));

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={Scale}
        title="Side-by-Side Comparison"
        description="Pick 2–4 models to compare every attribute. The best value in each numeric row is highlighted."
      />

      <Card className="p-4">
        <ModelMultiSelect models={models} selected={selected} onChange={setSelected} max={4} min={1} />
      </Card>

      {chosen.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Select at least one model to compare.</Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-card">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left font-medium text-muted-foreground">
                  Attribute
                </th>
                {chosen.map((m) => (
                  <th key={m.id} className="px-4 py-3 text-left">
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: vendorColor(m.vendor) }} />
                        {m.name}
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">{m.vendor}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <GroupBlock
                  key={group}
                  group={group}
                  rows={rows.filter((r) => r.group === group)}
                  chosen={chosen}
                  bestId={bestId}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GroupBlock({
  group,
  rows,
  chosen,
  bestId,
}: {
  group: string;
  rows: Row[];
  chosen: AIModel[];
  bestId: (row: Row) => string | null;
}) {
  return (
    <>
      <tr>
        <td
          colSpan={chosen.length + 1}
          className="sticky left-0 bg-background px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {group}
        </td>
      </tr>
      {rows.map((row) => {
        const winner = bestId(row);
        return (
          <tr key={row.label} className="border-b border-border/50 last:border-0">
            <td className="sticky left-0 z-[1] bg-card px-4 py-2.5 text-muted-foreground">{row.label}</td>
            {chosen.map((m) => (
              <td
                key={m.id}
                className={cn(
                  "px-4 py-2.5 tnum",
                  winner === m.id && "bg-brand-subtle/60 font-semibold text-foreground",
                )}
              >
                {row.render(m)}
              </td>
            ))}
          </tr>
        );
      })}
    </>
  );
}

function formatCompactTpm(tpm: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(tpm);
}
