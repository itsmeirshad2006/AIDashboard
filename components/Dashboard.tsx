"use client";

import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Info, Menu, X } from "lucide-react";
import { MODELS, DATA_LAST_UPDATED, DATA_DISCLAIMER } from "@/data/models";
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

export function Dashboard() {
  const [active, setActive] = useState<SectionId>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => setNow(new Date()), []);

  const models = MODELS;
  const activeDef = useMemo(() => SECTIONS.find((s) => s.id === active)!, [active]);

  function navigate(id: SectionId) {
    setActive(id);
    setMobileOpen(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar active={active} onSelect={navigate} className="hidden lg:flex" />

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden />
          <Sidebar active={active} onSelect={navigate} className="absolute left-0 top-0 flex h-full" onClose={() => setMobileOpen(false)} />
        </div>
      ) : null}

      {/* Main column */}
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
              <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground md:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Updated {formatDate(DATA_LAST_UPDATED)}
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
          {now === null ? (
            <LoadingState />
          ) : (
            <div className="animate-fade-in">
              {active === "overview" && <Overview models={models} now={now} onNavigate={navigate} />}
              {active === "recommend" && <RecommendationEngine now={now} />}
              {active === "compare" && <CompareTable models={models} />}
              {active === "sidebyside" && <SideBySide models={models} />}
              {active === "calculator" && <CostCalculator models={models} />}
              {active === "capabilities" && <CapabilityMatrix models={models} />}
              {active === "benchmarks" && <Benchmarks models={models} />}
              {active === "value" && <ValueForMoney models={models} />}
              {active === "lifecycle" && <Lifecycle models={models} now={now} />}
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
            <p className="shrink-0">Data last updated {formatDate(DATA_LAST_UPDATED)}</p>
          </div>
        </footer>
      </div>
    </div>
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
          Curated snapshot for comparison. Verify specs with each vendor.
        </p>
      </div>
    </aside>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-lg" />
        ))}
      </div>
      <div className="skeleton h-64 rounded-lg" />
    </div>
  );
}
