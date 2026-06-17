"use client";

import { useMemo } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import type { AIModel } from "@/lib/types";
import { BoolCell, Card, SectionHeading } from "@/components/ui/primitives";
import { vendorColor } from "@/lib/constants";

interface Col {
  key: string;
  label: string;
  get: (m: AIModel) => boolean;
  /** When true, a `true` value is the risky case (rendered inverted). */
  invert?: boolean;
}

const COLS: Col[] = [
  { key: "soc2", label: "SOC 2", get: (m) => m.compliance.soc2 },
  { key: "iso", label: "ISO 27001", get: (m) => m.compliance.iso27001 },
  { key: "hipaa", label: "HIPAA", get: (m) => m.compliance.hipaa },
  { key: "gdpr", label: "GDPR", get: (m) => m.compliance.gdpr },
  { key: "residency", label: "Data residency", get: (m) => m.compliance.dataResidency },
  { key: "notrain", label: "No training on your data", get: (m) => !m.compliance.trainsOnYourData },
];

export function Compliance({ models }: { models: AIModel[] }) {
  const sorted = useMemo(
    () => [...models].sort((a, b) => a.vendor.localeCompare(b.vendor) || a.name.localeCompare(b.name)),
    [models],
  );

  const summary = [
    { label: "SOC 2", count: models.filter((m) => m.compliance.soc2).length },
    { label: "ISO 27001", count: models.filter((m) => m.compliance.iso27001).length },
    { label: "HIPAA", count: models.filter((m) => m.compliance.hipaa).length },
    { label: "GDPR", count: models.filter((m) => m.compliance.gdpr).length },
    { label: "Data residency", count: models.filter((m) => m.compliance.dataResidency).length },
    { label: "No data training", count: models.filter((m) => !m.compliance.trainsOnYourData).length },
  ];

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={ShieldCheck}
        title="Compliance & Governance"
        description="Security attestations, privacy posture and data-handling policy per model. Verify current certifications with each vendor before procurement."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {summary.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-2xl font-bold text-foreground tnum">{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-card">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left font-medium text-muted-foreground">
                Model
              </th>
              {COLS.map((c) => (
                <th key={c.key} className="px-3 py-3 text-center font-medium text-muted-foreground">
                  {c.label}
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
                {COLS.map((c) => (
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

      <Card className="flex items-start gap-3 border-warning/30 bg-warning/5 p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <p className="text-sm text-muted-foreground">
          Self-hosted open-weights models (e.g. Llama, DeepSeek) inherit the compliance posture of{" "}
          <em>where you deploy them</em> — running them on a compliant cloud or on-prem environment can
          satisfy controls the base provider does not certify. Always confirm current attestations and
          Data Processing Agreements directly with the vendor.
        </p>
      </Card>
    </div>
  );
}
