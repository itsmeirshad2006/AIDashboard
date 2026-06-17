"use client";

import {
  ArrowRight,
  BadgeDollarSign,
  Boxes,
  Code2,
  Coins,
  Crown,
  Image as ImageIcon,
  Infinity as InfinityIcon,
  Layers,
  ServerCog,
  ShieldCheck,
  Unlock,
} from "lucide-react";
import type { AIModel } from "@/lib/types";
import type { SectionId } from "@/lib/sections";
import { Badge, Card } from "@/components/ui/primitives";
import { DeprecationBanner } from "@/components/DeprecationBanner";
import { vendorColor } from "@/lib/constants";
import {
  blendedCostPer1M,
  cheapestByBlended,
  cn,
  deprecatingSoon,
  formatPricePer1M,
  frontierByVendor,
  isActive,
  isMultimodalInput,
  mostMultimodal,
  multimodalModalityCount,
  supportsLongContext,
  topByBenchmark,
} from "@/lib/utils";

export function Overview({
  models,
  now,
  onNavigate,
}: {
  models: AIModel[];
  now: Date;
  onNavigate: (id: SectionId) => void;
}) {
  const cheapest = cheapestByBlended(models);
  const topCoder = topByBenchmark(models, "coding");
  const multimodalKing = mostMultimodal(models);
  const frontier = frontierByVendor(models);
  const frontierLeader = frontier[0];
  const longContext = models.filter((m) => supportsLongContext(m));
  const azure = models.filter((m) => m.deployment.azure);
  const openSource = models.filter((m) => m.openSource);
  const multimodalInputs = models.filter(isMultimodalInput);
  const soon = deprecatingSoon(models, now, 90);
  const activeCount = models.filter(isActive).length;
  const topCoders = [...models].sort((a, b) => b.benchmarks.coding - a.benchmarks.coding).slice(0, 3);

  const kpis = [
    {
      label: "Models tracked",
      value: String(models.length),
      sub: `${activeCount} active`,
      icon: Boxes,
      onClick: () => onNavigate("compare"),
    },
    {
      label: "Lowest blended cost",
      value: cheapest.name,
      sub: `${formatPricePer1M(blendedCostPer1M(cheapest))} / 1M blended`,
      icon: Coins,
      onClick: () => onNavigate("calculator"),
      accent: true,
    },
    {
      label: "Top coding model",
      value: topCoder.name,
      sub: `${topCoder.benchmarks.coding}/100 coding`,
      icon: Code2,
      onClick: () => onNavigate("benchmarks"),
    },
    {
      label: "Most multimodal",
      value: multimodalKing.name,
      sub: `${multimodalModalityCount(multimodalKing)} modalities`,
      icon: ImageIcon,
      onClick: () => onNavigate("capabilities"),
    },
    {
      label: "Frontier leader",
      value: frontierLeader?.vendor ?? "—",
      sub: `${frontierLeader?.count ?? 0} active frontier models`,
      icon: Crown,
      onClick: () => onNavigate("categories"),
    },
    {
      label: "Deprecating ≤ 90 days",
      value: String(soon.length),
      sub: soon.length ? "Action needed" : "All clear",
      icon: ServerCog,
      onClick: () => onNavigate("lifecycle"),
      warn: soon.length > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <DeprecationBanner models={models} now={now} onNavigate={() => onNavigate("lifecycle")} />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={k.onClick}
            className={cn(
              "group flex flex-col items-start rounded-lg border border-border bg-card p-4 text-left shadow-card transition hover:border-brand/50 hover:shadow-card-lg",
              k.accent && "ring-1 ring-brand/20",
            )}
          >
            <span
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md",
                k.warn ? "bg-warning/15 text-warning" : "bg-brand-subtle text-brand",
              )}
            >
              <k.icon className="h-4 w-4" />
            </span>
            <span className="mt-3 text-xs font-medium text-muted-foreground">{k.label}</span>
            <span className="mt-0.5 line-clamp-1 text-base font-semibold tracking-tight text-foreground">
              {k.value}
            </span>
            <span className={cn("mt-0.5 text-xs", k.warn ? "text-warning" : "text-muted-foreground")}>
              {k.sub}
            </span>
          </button>
        ))}
      </div>

      {/* Quick answers */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Answers at a glance
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AnswerCard
            icon={BadgeDollarSign}
            title="Which model has the lowest cost?"
            onClick={() => onNavigate("calculator")}
          >
            <strong className="text-foreground">{cheapest.name}</strong> is cheapest at{" "}
            <strong className="text-foreground">
              {formatPricePer1M(cheapest.pricing.inputPer1M)}
            </strong>{" "}
            in /{" "}
            <strong className="text-foreground">
              {formatPricePer1M(cheapest.pricing.outputPer1M)}
            </strong>{" "}
            out per 1M tokens.
          </AnswerCard>

          <AnswerCard
            icon={InfinityIcon}
            title="Which models support 1M+ context?"
            onClick={() => onNavigate("compare")}
          >
            <strong className="text-foreground">{longContext.length}</strong> models offer ≥1M-token
            context, including {listNames(longContext, 3)}.
          </AnswerCard>

          <AnswerCard
            icon={Layers}
            title="Which models are available on Azure?"
            onClick={() => onNavigate("compare")}
          >
            <strong className="text-foreground">{azure.length}</strong> models deploy on Azure:{" "}
            {listNames(azure, 3)}.
          </AnswerCard>

          <AnswerCard
            icon={Unlock}
            title="Which models are open source?"
            onClick={() => onNavigate("categories")}
          >
            <strong className="text-foreground">{openSource.length}</strong> open-weights models:{" "}
            {listNames(openSource, 3)}.
          </AnswerCard>

          <AnswerCard
            icon={Code2}
            title="Which models are best for coding?"
            onClick={() => onNavigate("benchmarks")}
          >
            <span className="flex flex-wrap gap-1.5">
              {topCoders.map((m, i) => (
                <Badge key={m.id} tone={i === 0 ? "brand" : "muted"}>
                  {m.name} · {m.benchmarks.coding}
                </Badge>
              ))}
            </span>
          </AnswerCard>

          <AnswerCard
            icon={ImageIcon}
            title="Which models support multimodal inputs?"
            onClick={() => onNavigate("capabilities")}
          >
            <strong className="text-foreground">{multimodalInputs.length}</strong> models accept image,
            audio or video input.
          </AnswerCard>

          <AnswerCard
            icon={Crown}
            title="Which vendor has the most frontier models?"
            onClick={() => onNavigate("categories")}
          >
            <span className="flex flex-wrap items-center gap-1.5">
              {frontier.slice(0, 4).map((f, i) => (
                <span
                  key={f.vendor}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs",
                    i === 0
                      ? "bg-brand-subtle font-semibold text-brand"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: vendorColor(f.vendor) }} />
                  {f.vendor} · {f.count}
                </span>
              ))}
            </span>
          </AnswerCard>

          <AnswerCard
            icon={ServerCog}
            title="Which models are deprecating soon?"
            onClick={() => onNavigate("lifecycle")}
            warn={soon.length > 0}
          >
            {soon.length === 0 ? (
              "No models are scheduled for retirement within 90 days."
            ) : (
              <>
                <strong className="text-foreground">{soon.length}</strong> within 90 days:{" "}
                {listNames(soon, 3)}.
              </>
            )}
          </AnswerCard>

          <AnswerCard
            icon={ShieldCheck}
            title="Which models meet enterprise compliance?"
            onClick={() => onNavigate("compliance")}
          >
            <strong className="text-foreground">
              {models.filter((m) => m.compliance.soc2 && m.compliance.gdpr).length}
            </strong>{" "}
            models hold both SOC 2 and GDPR;{" "}
            <strong className="text-foreground">
              {models.filter((m) => m.compliance.hipaa).length}
            </strong>{" "}
            support HIPAA.
          </AnswerCard>
        </div>
      </div>
    </div>
  );
}

function listNames(models: AIModel[], limit: number): string {
  const names = models.map((m) => m.name);
  if (names.length <= limit) return names.join(", ");
  return `${names.slice(0, limit).join(", ")} +${names.length - limit} more`;
}

function AnswerCard({
  icon: Icon,
  title,
  children,
  onClick,
  warn,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  onClick: () => void;
  warn?: boolean;
}) {
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
            warn ? "bg-warning/15 text-warning" : "bg-brand-subtle text-brand",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold leading-snug text-foreground">{title}</h3>
      </div>
      <div className="mt-2 flex-1 text-sm text-muted-foreground">{children}</div>
      <button
        type="button"
        onClick={onClick}
        className="mt-3 inline-flex items-center gap-1 self-start text-xs font-medium text-brand transition hover:gap-1.5"
      >
        Explore <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
