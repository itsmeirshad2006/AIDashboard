"use client";

import { useMemo } from "react";
import { Grid3x3 } from "lucide-react";
import type { AIModel } from "@/lib/types";
import { BoolCell, SectionHeading } from "@/components/ui/primitives";
import { vendorColor } from "@/lib/constants";

interface Cap {
  key: string;
  label: string;
  get: (m: AIModel) => boolean;
}

const CAPS: Cap[] = [
  { key: "fn", label: "Function calling", get: (m) => m.capabilities.functionCalling },
  { key: "json", label: "JSON / structured", get: (m) => m.capabilities.structuredOutput },
  { key: "stream", label: "Streaming", get: (m) => m.capabilities.streaming },
  { key: "image", label: "Vision (image)", get: (m) => m.multimodal.image },
  { key: "audio", label: "Audio", get: (m) => m.multimodal.audio },
  { key: "video", label: "Video", get: (m) => m.multimodal.video },
  { key: "ft", label: "Fine-tuning", get: (m) => m.capabilities.fineTuning },
  { key: "reason", label: "Reasoning mode", get: (m) => m.capabilities.reasoningMode },
];

export function CapabilityMatrix({ models }: { models: AIModel[] }) {
  const sorted = useMemo(
    () => [...models].sort((a, b) => a.vendor.localeCompare(b.vendor) || a.name.localeCompare(b.name)),
    [models],
  );
  const totals = CAPS.map((c) => models.filter(c.get).length);

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={Grid3x3}
        title="Capability Matrix"
        description="A yes/no grid of supported features across every model. Column totals show how many models offer each capability."
      />

      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-card">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left font-medium text-muted-foreground">
                Model
              </th>
              {CAPS.map((c, i) => (
                <th key={c.key} className="px-3 py-3 text-center font-medium text-muted-foreground">
                  <div className="flex flex-col items-center gap-0.5">
                    <span>{c.label}</span>
                    <span className="rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground tnum">
                      {totals[i]}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => (
              <tr key={m.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                <td className="sticky left-0 z-[1] bg-card px-4 py-2.5">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: vendorColor(m.vendor) }} />
                    <span className="font-medium text-foreground">{m.name}</span>
                  </span>
                </td>
                {CAPS.map((c) => (
                  <td key={c.key} className="px-3 py-2.5 text-center">
                    <span className="inline-flex justify-center">
                      <BoolCell value={c.get(m)} label={`${m.name} ${c.label}`} />
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
