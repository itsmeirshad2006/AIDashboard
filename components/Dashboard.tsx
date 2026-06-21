"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BrainCircuit, Info, Menu, RefreshCw, Sparkles, TriangleAlert, X } from "lucide-react";
import { DATA_DISCLAIMER } from "@/data/models";
import type { AIModel } from "@/lib/types";
import { SECTIONS, SECTION_GROUPS, type SectionId } from "@/lib/sections";
import { cn, formatDate } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

import { Overview } from "@/components/sections/Overview";
import { RecommendationEngine } from "@/components/sections/RecommendationEngine";
import { CompareTable } from "@/components/sections/CompareTable";
import { SideBySide } from "@/components/sections/SideBySide";
import { CostCalculator } from "@/components/sections/CostCalculator";
import { CapabilityMatrix } from "@/components/sections/CapabilityMatrix";
import { Benchmarks } from "@/components/sections/Benchmarks";
import { ValueForMoney } from "@/components/sections/ValueForMoney";
import { Lifecycle } from "@/components/sections/Lifecycle";
import { Categories } from "@/components/sections/Categories";
import { Compliance } from "@/components/sections/Compliance";
import { Certifications } from "@/components/sections/Certifications";
import { Performance } from "@/components/sections/Performance";

interface Catalog {
  models: AIModel[];
  source: "gemini" | "fallback";
  generatedAt: string;
  geminiModel: string | null;
  note: string;
  error?: string;
}

export function Dashboard() {
  const [active, setActive] = useState<SectionId>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => setNow(new Date()), []);

  const loadCatalog = useCallback(async (refresh = false) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/models${refresh ? "?refresh=1" : ""}`, { cache: "no-store" });
      const data = (await res.json()) as Catalog;
      if (!data.models?.length) throw new Error("No models returned.");
      setCatalog(data);
    } catch {
      setLoadError("Could not load the model catalog. Please retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const activeDef = useMemo(() => SECTIONS.find((s) => s.id === active)!, [active]);
  const models = catalog?.models ?? [];

  function navigate(id: SectionId) {
    setActive(id);
    setMobileOpen(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const ready = now !== null && catalog !== null && !loading;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar active={active} onSelect={navigate} className="hidden lg:flex" />

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden />
          <Sidebar active={active} onSelect={navigate} className="absolute left-0 top-0 flex h-full" onClose={() => setMobileOpen(false)} />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">{activeDef.label}</h1>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">{activeDef.description}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DataSourceBadge catalog={catalog} loading={loading} onRefresh={() => loadCatalog(true)} />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
          {catalog?.source === "fallback" && ready ? (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Showing a reference snapshot.</span> {catalog.note}
                {catalog.error ? <span className="block text-xs opacity-80">Reason: {catalog.error}</span> : null}
              </p>
            </div>
          ) : null}

          {loadError && !loading ? (
            <div className="rounded-lg border border-danger/40 bg-danger/5 p-5">
              <p className="text-sm font-medium text-foreground">Failed to load the catalog</p>
              <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
              <button
                type="button"
                onClick={() => loadCatalog()}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground hover:opacity-90"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          ) : !ready ? (
            <LoadingState />
          ) : (
            <div className="animate-fade-in">
              {active === "overview" && <Overview models={models} now={now!} onNavigate={navigate} />}
              {active === "recommend" && <RecommendationEngine models={models} />}
              {active === "compare" && <CompareTable models={models} />}
              {active === "sidebyside" && <SideBySide models={models} />}
              {active === "calculator" && <CostCalculator models={models} />}
              {active === "capabilities" && <CapabilityMatrix models={models} />}
              {active === "benchmarks" && <Benchmarks models={models} />}
              {active === "value" && <ValueForMoney models={models} />}
              {active === "lifecycle" && <Lifecycle models={models} now={now!} />}
              {active === "categories" && <Categories models={models} />}
              {active === "compliance" && <Compliance models={models} />}
              {active === "certifications" && <Certifications models={models} />}
              {active === "performance" && <Performance models={models} />}
            </div>
          )}
        </main>

        <footer className="border-t border-border px-4 py-5 sm:px-6">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-1.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="max-w-3xl">{DATA_DISCLAIMER}</span>
            </p>
            <div className="flex shrink-0 flex-col items-start gap-0.5 sm:items-end">
              <p className="font-medium text-foreground">
                Built by <span className="text-brand">Irshad Mohammad Safeer</span>
              </p>
              {catalog ? (
                <p>
                  {catalog.source === "gemini" ? "Generated" : "Snapshot"} {formatDate(catalog.generatedAt.slice(0, 10))}
                </p>
              ) : null}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function DataSourceBadge({
  catalog,
  loading,
  onRefresh,
}: {
  catalog: Catalog | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const isLive = catalog?.source === "gemini";
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={loading}
      title={
        loading
          ? "Loading catalog…"
          : isLive
            ? `Live data from Gemini (${catalog?.geminiModel}). Click to refresh.`
            : "Reference snapshot — click to retry live data."
      }
      className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-muted disabled:opacity-60 md:inline-flex"
    >
      {loading ? (
        <RefreshCw className="h-3 w-3 animate-spin" />
      ) : isLive ? (
        <Sparkles className="h-3 w-3 text-brand" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
      )}
      {loading ? "Loading…" : isLive ? "Live · Gemini" : "Reference data"}
    </button>
  );
}

function Sidebar({
  active,
  onSelect,
  className,
  onClose,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  className?: string;
  onClose?: () => void;
}) {
  return (
    <aside
      className={cn(
        "z-50 w-64 shrink-0 flex-col border-r border-border bg-card",
        "fixed inset-y-0 left-0",
        className,
      )}
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-sm">
          <BrainCircuit className="h-5 w-5" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-foreground">AI Models</p>
          <p className="truncate text-[11px] text-muted-foreground">Intelligence Dashboard</p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {SECTION_GROUPS.map((group) => (
          <div key={group}>
            <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group}
            </p>
            <ul className="space-y-0.5">
              {SECTIONS.filter((s) => s.group === group).map((s) => {
                const isActive = s.id === active;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(s.id)}
                      className={cn(
                        "group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition",
                        isActive
                          ? "bg-brand-subtle text-brand"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <s.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-brand" : "text-muted-foreground")} />
                      <span className="truncate">{s.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Data generated by the Gemini API. AI-generated specs — verify with each vendor.
        </p>
        <p className="mt-2 text-[11px] font-medium text-foreground">
          Built by <span className="text-brand">Irshad Mohammad Safeer</span>
        </p>
      </div>
    </aside>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 animate-pulse text-brand" />
        Generating the model catalog with Gemini…
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-lg" />
        ))}
      </div>
      <div className="skeleton h-64 rounded-lg" />
    </div>
  );
}
