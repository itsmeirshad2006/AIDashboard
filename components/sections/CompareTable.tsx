"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Download, Search, X } from "lucide-react";
import type { AIModel, ModelStatus } from "@/lib/types";
import { Badge, SectionHeading } from "@/components/ui/primitives";
import { Table2 } from "lucide-react";
import { vendorColor } from "@/lib/constants";
import {
  blendedCostPer1M,
  capabilityScore,
  cn,
  downloadCSV,
  formatDate,
  formatInt,
  formatPricePer1M,
  formatTokens,
  isMultimodalInput,
  STATUS_META,
  supportsLongContext,
  uniqueVendors,
} from "@/lib/utils";

type SortKey =
  | "name"
  | "vendor"
  | "status"
  | "agentic"
  | "input"
  | "output"
  | "blended"
  | "context"
  | "maxOutput"
  | "coding"
  | "reasoning"
  | "capability"
  | "latency"
  | "throughput";

interface Column {
  key: SortKey;
  label: string;
  numeric?: boolean;
  value: (m: AIModel) => number | string;
  render: (m: AIModel) => React.ReactNode;
}

const STATUSES: ModelStatus[] = ["Active", "Preview", "Deprecated", "Retired"];

export function CompareTable({ models }: { models: AIModel[] }) {
  const vendors = useMemo(() => uniqueVendors(models), [models]);
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<ModelStatus>>(new Set());
  const [flags, setFlags] = useState({ azure: false, open: false, multimodal: false, longCtx: false });
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "capability", dir: "desc" });

  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        label: "Model",
        value: (m) => m.name,
        render: (m) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{m.name}</span>
            <span className="text-xs text-muted-foreground">{m.version}</span>
          </div>
        ),
      },
      {
        key: "vendor",
        label: "Vendor",
        value: (m) => m.vendor,
        render: (m) => (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: vendorColor(m.vendor) }} />
            {m.vendor}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        value: (m) => m.status,
        render: (m) => {
          const meta = STATUS_META[m.status];
          return <Badge tone={meta.tone as "success" | "warning" | "danger" | "info"}>{meta.label}</Badge>;
        },
      },
      {
        key: "agentic",
        label: "Agentic",
        value: (m) => m.agenticTier ?? "",
        render: (m) => <span className="text-xs text-muted-foreground">{m.agenticTier ?? "—"}</span>,
      },
      {
        key: "input",
        label: "Input /1M",
        numeric: true,
        value: (m) => m.pricing.inputPer1M,
        render: (m) =>
          m.pricing.selfHosted ? <span className="text-xs text-muted-foreground">Self-host</span> : formatPricePer1M(m.pricing.inputPer1M),
      },
      {
        key: "output",
        label: "Output /1M",
        numeric: true,
        value: (m) => m.pricing.outputPer1M,
        render: (m) =>
          m.pricing.selfHosted ? <span className="text-xs text-muted-foreground">Self-host</span> : formatPricePer1M(m.pricing.outputPer1M),
      },
      {
        key: "blended",
        label: "Blended /1M",
        numeric: true,
        value: (m) => blendedCostPer1M(m),
        render: (m) =>
          m.pricing.selfHosted ? (
            <span className="text-xs text-muted-foreground">Self-host</span>
          ) : (
            <span className="font-medium text-foreground">{formatPricePer1M(blendedCostPer1M(m))}</span>
          ),
      },
      {
        key: "context",
        label: "Context",
        numeric: true,
        value: (m) => m.contextWindow,
        render: (m) => (
          <span className={cn(supportsLongContext(m) && "font-medium text-brand")}>
            {formatTokens(m.contextWindow)}
          </span>
        ),
      },
      {
        key: "maxOutput",
        label: "Max out",
        numeric: true,
        value: (m) => m.maxOutputTokens,
        render: (m) => formatTokens(m.maxOutputTokens),
      },
      {
        key: "coding",
        label: "Coding",
        numeric: true,
        value: (m) => m.benchmarks.coding,
        render: (m) => <ScorePill v={m.benchmarks.coding} />,
      },
      {
        key: "reasoning",
        label: "Reasoning",
        numeric: true,
        value: (m) => m.benchmarks.reasoning,
        render: (m) => <ScorePill v={m.benchmarks.reasoning} />,
      },
      {
        key: "capability",
        label: "Capability",
        numeric: true,
        value: (m) => capabilityScore(m),
        render: (m) => <ScorePill v={capabilityScore(m)} strong />,
      },
      {
        key: "latency",
        label: "Latency",
        numeric: true,
        value: (m) => m.latencyMsAvg,
        render: (m) => `${formatInt(m.latencyMsAvg)}ms`,
      },
      {
        key: "throughput",
        label: "Tok/s",
        numeric: true,
        value: (m) => m.throughputTokensPerSec,
        render: (m) => formatInt(m.throughputTokensPerSec),
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = models.filter((m) => {
      if (q) {
        const hay = `${m.name} ${m.vendor} ${m.version} ${m.categories.join(" ")} ${m.bestUseCases.join(" ")} ${m.license}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (vendorFilter.size && !vendorFilter.has(m.vendor)) return false;
      if (statusFilter.size && !statusFilter.has(m.status)) return false;
      if (flags.azure && !m.deployment.azure) return false;
      if (flags.open && !m.openSource) return false;
      if (flags.multimodal && !isMultimodalInput(m)) return false;
      if (flags.longCtx && !supportsLongContext(m)) return false;
      return true;
    });

    const col = columns.find((c) => c.key === sort.key)!;
    rows = [...rows].sort((a, b) => {
      const av = col.value(a);
      const bv = col.value(b);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [models, search, vendorFilter, statusFilter, flags, sort, columns]);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" || key === "vendor" ? "asc" : "desc" },
    );
  }

  function toggleSetItem<T>(set: Set<T>, item: T): Set<T> {
    const next = new Set(set);
    next.has(item) ? next.delete(item) : next.add(item);
    return next;
  }

  function resetFilters() {
    setSearch("");
    setVendorFilter(new Set());
    setStatusFilter(new Set());
    setFlags({ azure: false, open: false, multimodal: false, longCtx: false });
  }

  function exportCsv() {
    downloadCSV(
      "ai-models.csv",
      filtered.map((m) => ({
        Model: m.name,
        Vendor: m.vendor,
        Version: m.version,
        Status: m.status,
        ReleaseDate: m.releaseDate,
        DeprecationDate: m.deprecationDate ?? "",
        KnowledgeCutoff: m.knowledgeCutoff,
        InputPer1M: m.pricing.inputPer1M,
        OutputPer1M: m.pricing.outputPer1M,
        BlendedPer1M: Number(blendedCostPer1M(m).toFixed(3)),
        ContextWindow: m.contextWindow,
        MaxOutputTokens: m.maxOutputTokens,
        Multimodal: [m.multimodal.text && "text", m.multimodal.image && "image", m.multimodal.audio && "audio", m.multimodal.video && "video"].filter(Boolean).join("|"),
        OpenSource: m.openSource,
        License: m.license,
        Azure: m.deployment.azure,
        AWSBedrock: m.deployment.awsBedrock,
        GCPVertex: m.deployment.gcpVertex,
        SelfHostable: m.deployment.selfHostable,
        Reasoning: m.benchmarks.reasoning,
        Coding: m.benchmarks.coding,
        Math: m.benchmarks.math,
        Multilingual: m.benchmarks.multilingual,
        Vision: m.benchmarks.vision,
        LatencyMsAvg: m.latencyMsAvg,
        ThroughputTokPerSec: m.throughputTokensPerSec,
        RPM: m.rateLimits.rpm,
        TPM: m.rateLimits.tpm,
        SOC2: m.compliance.soc2,
        ISO27001: m.compliance.iso27001,
        HIPAA: m.compliance.hipaa,
        GDPR: m.compliance.gdpr,
        DataResidency: m.compliance.dataResidency,
        TrainsOnYourData: m.compliance.trainsOnYourData,
        Categories: m.categories.join("|"),
        Certifications: m.certifications.join("|"),
      })),
    );
  }

  const hasFilters = !!search || vendorFilter.size || statusFilter.size || Object.values(flags).some(Boolean);

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={Table2}
        title="Master Comparison Table"
        description="Search, filter and sort every model across pricing, context, benchmarks and performance. Export the current view to CSV."
        action={
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        }
      />

      {/* Filter bar */}
      <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models, vendors, use cases, licenses…"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {vendors.map((v) => (
            <FilterChip key={v} active={vendorFilter.has(v)} onClick={() => setVendorFilter((s) => toggleSetItem(s, v))}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: vendorColor(v) }} />
              {v}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STATUSES.map((s) => (
            <FilterChip key={s} active={statusFilter.has(s)} onClick={() => setStatusFilter((set) => toggleSetItem(set, s))}>
              {s}
            </FilterChip>
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          <FilterChip active={flags.azure} onClick={() => setFlags((f) => ({ ...f, azure: !f.azure }))}>
            On Azure
          </FilterChip>
          <FilterChip active={flags.open} onClick={() => setFlags((f) => ({ ...f, open: !f.open }))}>
            Open source
          </FilterChip>
          <FilterChip active={flags.multimodal} onClick={() => setFlags((f) => ({ ...f, multimodal: !f.multimodal }))}>
            Multimodal
          </FilterChip>
          <FilterChip active={flags.longCtx} onClick={() => setFlags((f) => ({ ...f, longCtx: !f.longCtx }))}>
            1M+ context
          </FilterChip>
          {hasFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          Showing <strong className="text-foreground">{filtered.length}</strong> of {models.length} models
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-card">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((c) => {
                const isActive = sort.key === c.key;
                return (
                  <th
                    key={c.key}
                    className={cn(
                      "whitespace-nowrap px-3 py-2.5 text-left font-medium text-muted-foreground",
                      c.numeric && "text-right",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={cn(
                        "inline-flex items-center gap-1 transition hover:text-foreground",
                        c.numeric && "flex-row-reverse",
                        isActive && "text-foreground",
                      )}
                    >
                      {c.label}
                      {isActive ? (
                        sort.dir === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn("whitespace-nowrap px-3 py-2.5 align-middle tnum", c.numeric && "text-right")}
                  >
                    {c.render(m)}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-12 text-center text-sm text-muted-foreground">
                  No models match your filters.{" "}
                  <button onClick={resetFilters} className="font-medium text-brand hover:underline">
                    Clear filters
                  </button>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScorePill({ v, strong }: { v: number; strong?: boolean }) {
  const tone = v >= 90 ? "text-success" : v >= 80 ? "text-brand" : v >= 70 ? "text-foreground" : "text-muted-foreground";
  if (v === 0) return <span className="text-muted-foreground/40">—</span>;
  return <span className={cn("tnum", tone, strong && "font-semibold")}>{Math.round(v)}</span>;
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
        active
          ? "border-brand bg-brand-subtle text-brand"
          : "border-border bg-background text-muted-foreground hover:border-brand/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
