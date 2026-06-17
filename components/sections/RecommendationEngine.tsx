"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  Sparkles,
  TriangleAlert,
  CheckCircle2,
} from "lucide-react";
import { MODELS } from "@/data/models";
import type { AIModel } from "@/lib/types";
import { Badge, Card, SectionHeading } from "@/components/ui/primitives";
import { blendedCostPer1M, cn, formatPricePer1M, formatTokens } from "@/lib/utils";
import { vendorColor } from "@/lib/constants";

interface RecommendationItem {
  modelId: string;
  modelName: string;
  vendor: string;
  matchScore: number;
  reasons: string[];
  watchOuts: string[];
}
interface RecommendationResponse {
  summary: string;
  recommendations: RecommendationItem[];
}

const EXAMPLES = [
  "Cheapest model for high-volume customer support chat with 100M tokens/month, GDPR + EU data residency required.",
  "Best model for an autonomous coding agent on a large monorepo — needs strong coding and big context.",
  "HIPAA-compliant multimodal model to analyze medical images and documents, low latency.",
  "Open-source model we can self-host on-prem for private reasoning workloads, no vendor lock-in.",
];

function scoreTone(score: number): string {
  if (score >= 85) return "text-success";
  if (score >= 70) return "text-brand";
  if (score >= 50) return "text-warning";
  return "text-muted-foreground";
}

export function RecommendationEngine({ now }: { now: Date }) {
  const [requirement, setRequirement] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResponse | null>(null);

  async function submit(text: string) {
    const value = text.trim();
    if (!value || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement: value }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || `Request failed (${res.status}).`);
      } else {
        setResult(data as RecommendationResponse);
      }
    } catch {
      setError("Could not reach the recommendation service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        icon={Sparkles}
        title="AI Recommendation Engine"
        description="Describe your requirement in plain language — budget, use case, compliance, latency, context. Gemini ranks the best-fit models from the catalog and explains exactly why."
      />

      <Card className="overflow-hidden">
        <div className="border-b border-border bg-gradient-to-r from-brand-subtle to-transparent px-5 py-3">
          <p className="flex items-center gap-2 text-xs font-medium text-brand">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Google Gemini · recommendations are generated, always verify specs
          </p>
        </div>
        <div className="p-5">
          <label htmlFor="requirement" className="mb-2 block text-sm font-medium text-foreground">
            What do you need a model for?
          </label>
          <textarea
            id="requirement"
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(requirement);
            }}
            rows={4}
            maxLength={2000}
            placeholder="e.g. I need an affordable model for summarizing legal documents up to 500K tokens, must be SOC 2 and HIPAA compliant, latency under 1s preferred."
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground tnum">{requirement.length}/2000</span>
            <button
              type="button"
              onClick={() => submit(requirement)}
              disabled={loading || !requirement.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Recommend models
                </>
              )}
            </button>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Try an example
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setRequirement(ex);
                    submit(ex);
                  }}
                  disabled={loading}
                  className="max-w-full truncate rounded-full border border-border bg-muted/50 px-3 py-1 text-left text-xs text-muted-foreground transition hover:border-brand hover:text-foreground disabled:opacity-50"
                  title={ex}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Loading skeletons */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-5">
              <div className="skeleton h-5 w-48" />
              <div className="skeleton mt-3 h-3 w-full" />
              <div className="skeleton mt-2 h-3 w-3/4" />
            </Card>
          ))}
        </div>
      ) : null}

      {/* Error */}
      {error && !loading ? (
        <Card className="border-danger/40 bg-danger/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-semibold text-foreground">Could not generate a recommendation</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <button
                type="button"
                onClick={() => submit(requirement)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
              >
                Try again <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Results */}
      {result && !loading ? (
        <div className="space-y-4 animate-fade-in">
          {result.summary ? (
            <Card className="border-brand/30 bg-brand-subtle/50 p-5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand">
                <Sparkles className="h-3.5 w-3.5" /> Summary
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{result.summary}</p>
            </Card>
          ) : null}

          {result.recommendations.map((rec, idx) => {
            const model = MODELS.find((m) => m.id === rec.modelId) as AIModel | undefined;
            return (
              <RecommendationCard key={rec.modelId} rec={rec} rank={idx + 1} model={model} now={now} />
            );
          })}
        </div>
      ) : null}

      {/* Empty initial state */}
      {!result && !loading && !error ? (
        <Card className="border-dashed p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-brand/60" />
          <p className="mt-3 text-sm font-medium text-foreground">
            Your ranked recommendation will appear here
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Enter a requirement above or pick an example. Every recommendation comes with a clear,
            specific rationale — no black boxes.
          </p>
        </Card>
      ) : null}
    </div>
  );
}

function RecommendationCard({
  rec,
  rank,
  model,
  now,
}: {
  rec: RecommendationItem;
  rank: number;
  model?: AIModel;
  now: Date;
}) {
  return (
    <Card className="overflow-hidden animate-fade-in">
      <div className="flex flex-col gap-4 p-5 sm:flex-row">
        <div className="flex shrink-0 items-start gap-3">
          <span
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
              rank === 1 ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {rank}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-base font-semibold text-foreground">{rec.modelName}</h3>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
              style={{ color: vendorColor(rec.vendor) }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: vendorColor(rec.vendor) }} />
              {rec.vendor}
            </span>
            <span className={cn("ml-auto text-sm font-bold tnum", scoreTone(rec.matchScore))}>
              {rec.matchScore}
              <span className="text-xs font-normal text-muted-foreground">/100 fit</span>
            </span>
          </div>

          {model ? (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                In <strong className="text-foreground">{formatPricePer1M(model.pricing.inputPer1M)}</strong> · Out{" "}
                <strong className="text-foreground">{formatPricePer1M(model.pricing.outputPer1M)}</strong> /1M
              </span>
              <span>
                Context <strong className="text-foreground">{formatTokens(model.contextWindow)}</strong>
              </span>
              <span>
                Blended{" "}
                <strong className="text-foreground">{formatPricePer1M(blendedCostPer1M(model))}</strong>/1M
              </span>
              <Badge tone={model.status === "Active" ? "success" : "warning"}>{model.status}</Badge>
            </div>
          ) : null}

          <ul className="mt-3 space-y-1.5">
            {rec.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>

          {rec.watchOuts.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {rec.watchOuts.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {model ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {model.categories.map((c) => (
                <Badge key={c} tone="outline">
                  {c}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
