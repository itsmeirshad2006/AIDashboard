"use client";

import { useMemo, useState } from "react";
import { BadgeCheck } from "lucide-react";
import type { AIModel } from "@/lib/types";
import { Badge, Card, SectionHeading } from "@/components/ui/primitives";
import { vendorColor } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Certifications({ models }: { models: AIModel[] }) {
  const certIndex = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of models) for (const c of m.certifications) map.set(c, (map.get(c) ?? 0) + 1);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [models]);

  const [filter, setFilter] = useState<string | null>(null);

  const shown = useMemo(
    () =>
      [...models]
        .filter((m) => (filter ? m.certifications.includes(filter) : true))
        .sort((a, b) => a.vendor.localeCompare(b.vendor) || a.name.localeCompare(b.name)),
    [models, filter],
  );

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={BadgeCheck}
        title="Certifications"
        description="Attestations and licenses associated with each model. Click a certification to filter the models that hold it."
      />

      <Card className="p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Certifications across the catalog
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilter(null)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition",
              filter === null
                ? "border-brand bg-brand-subtle text-brand"
                : "border-border text-muted-foreground hover:border-brand/40 hover:text-foreground",
            )}
          >
            All
          </button>
          {certIndex.map(([cert, count]) => (
            <button
              key={cert}
              type="button"
              onClick={() => setFilter(cert === filter ? null : cert)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
                filter === cert
                  ? "border-brand bg-brand-subtle text-brand"
                  : "border-border text-muted-foreground hover:border-brand/40 hover:text-foreground",
              )}
            >
              {cert}
              <span className="rounded-full bg-muted px-1.5 text-[10px] font-semibold tnum">{count}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((m) => (
          <Card key={m.id} className="p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: vendorColor(m.vendor) }} />
              <h3 className="text-sm font-semibold text-foreground">{m.name}</h3>
              <span className="ml-auto text-xs text-muted-foreground">{m.vendor}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {m.certifications.map((c) => (
                <Badge key={c} tone={c === filter ? "brand" : "outline"}>
                  <BadgeCheck className="h-3 w-3" />
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
