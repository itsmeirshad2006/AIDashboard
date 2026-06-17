import type { AIModel, ModelStatus } from "@/lib/types";

/* ─────────────────────────── class names ─────────────────────────── */

/** Tiny className combiner (no external deps). Falsy values are dropped. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ───────────────────────────── formatting ────────────────────────── */

export function formatUSD(value: number, maxFractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}

/** Price per 1M tokens, showing enough precision for sub-cent values. */
export function formatPricePer1M(value: number): string {
  if (value === 0) return "$0.00";
  const digits = value < 0.1 ? 4 : value < 1 ? 3 : 2;
  let s = value.toFixed(digits);
  if (s.includes(".")) s = s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  const decimals = s.split(".")[1]?.length ?? 0;
  if (decimals < 2) s = value.toFixed(2);
  return `$${s}`;
}

/** 1_000_000 → "1M", 200_000 → "200K", 10_000_000 → "10M". */
export function formatTokens(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const k = n / 1_000;
    return `${Number.isInteger(k) ? k : k.toFixed(0)}K`;
  }
  return `${n}`;
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function formatInt(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/* ───────────────────────────── date math ─────────────────────────── */

/** Whole days from `now` until `iso` (negative if already past). */
export function daysUntil(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const target = new Date(iso + "T00:00:00").getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86_400_000);
}

export function isDeprecatingWithin(model: AIModel, now: Date, days = 90): boolean {
  const d = daysUntil(model.deprecationDate, now);
  return d !== null && d >= 0 && d <= days;
}

/* ───────────────────────────── cost math ─────────────────────────── */

/**
 * Blended cost per 1M tokens using a realistic input:output mix.
 * Default 75% input / 25% output (≈3:1), a common production ratio.
 */
export function blendedCostPer1M(model: AIModel, inputShare = 0.75): number {
  return model.pricing.inputPer1M * inputShare + model.pricing.outputPer1M * (1 - inputShare);
}

/** Simple sum of input + output list price per 1M tokens. */
export function sumCostPer1M(model: AIModel): number {
  return model.pricing.inputPer1M + model.pricing.outputPer1M;
}

/**
 * Estimated monthly cost given monthly volumes expressed in millions of tokens.
 * Optionally applies the batch discount.
 */
export function monthlyCost(
  model: AIModel,
  inputMillions: number,
  outputMillions: number,
  useBatch = false,
): number {
  const discount = useBatch ? model.pricing.batchDiscount ?? 0 : 0;
  const factor = 1 - discount;
  return (
    inputMillions * model.pricing.inputPer1M * factor +
    outputMillions * model.pricing.outputPer1M * factor
  );
}

/* ─────────────────────────── benchmark math ──────────────────────── */

/** Average of the four core text benchmarks (vision handled separately). */
export function capabilityScore(model: AIModel): number {
  const b = model.benchmarks;
  return (b.reasoning + b.coding + b.math + b.multilingual) / 4;
}

/** Overall score including vision only when the model is vision-capable. */
export function overallScore(model: AIModel): number {
  const b = model.benchmarks;
  const scores = [b.reasoning, b.coding, b.math, b.multilingual];
  if (b.vision > 0) scores.push(b.vision);
  return scores.reduce((a, c) => a + c, 0) / scores.length;
}

/**
 * Value-for-money: capability per dollar of blended cost, scaled for
 * readability. Higher is better. Guards against zero cost.
 */
export function valueScore(model: AIModel): number {
  const cost = blendedCostPer1M(model);
  if (cost <= 0) return capabilityScore(model);
  return capabilityScore(model) / cost;
}

/* ─────────────────────────── capability helpers ──────────────────── */

export function isMultimodalInput(model: AIModel): boolean {
  const m = model.multimodal;
  return m.image || m.audio || m.video;
}

/** True for models billed per-token via an API (excludes self-hosted open weights). */
export function hasApiPricing(model: AIModel): boolean {
  return !model.pricing.selfHosted && (model.pricing.inputPer1M > 0 || model.pricing.outputPer1M > 0);
}

export function multimodalModalityCount(model: AIModel): number {
  const m = model.multimodal;
  return [m.text, m.image, m.audio, m.video].filter(Boolean).length;
}

export function supportsLongContext(model: AIModel, threshold = 1_000_000): boolean {
  return model.contextWindow >= threshold;
}

export function isFrontier(model: AIModel): boolean {
  return model.categories.includes("Frontier");
}

export function isActive(model: AIModel): boolean {
  return model.status === "Active" || model.status === "Preview";
}

/* ─────────────────────────── aggregations ────────────────────────── */

export function uniqueVendors(models: AIModel[]): string[] {
  return Array.from(new Set(models.map((m) => m.vendor))).sort();
}

/** Cheapest model by blended cost among those with metered API pricing. */
export function cheapestByBlended(models: AIModel[]): AIModel {
  const metered = models.filter(hasApiPricing);
  const pool = metered.length ? metered : models;
  return [...pool].sort((a, b) => blendedCostPer1M(a) - blendedCostPer1M(b))[0];
}

export function topByBenchmark(models: AIModel[], key: keyof AIModel["benchmarks"]): AIModel {
  return [...models].sort((a, b) => b.benchmarks[key] - a.benchmarks[key])[0];
}

export function mostMultimodal(models: AIModel[]): AIModel {
  return [...models].sort(
    (a, b) =>
      multimodalModalityCount(b) - multimodalModalityCount(a) ||
      b.benchmarks.vision - a.benchmarks.vision,
  )[0];
}

export interface VendorFrontierCount {
  vendor: string;
  count: number;
}

/**
 * Vendors ranked by number of ACTIVE frontier models (desc). Ties are broken
 * by the vendor's single strongest model (highest capability score), so the
 * vendor leading on raw capability edges out an equal-count rival.
 */
export function frontierByVendor(models: AIModel[]): VendorFrontierCount[] {
  const counts = new Map<string, number>();
  const topScore = new Map<string, number>();
  for (const m of models) {
    if (isFrontier(m) && isActive(m)) {
      counts.set(m.vendor, (counts.get(m.vendor) ?? 0) + 1);
      topScore.set(m.vendor, Math.max(topScore.get(m.vendor) ?? 0, capabilityScore(m)));
    }
  }
  return Array.from(counts.entries())
    .map(([vendor, count]) => ({ vendor, count }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        (topScore.get(b.vendor) ?? 0) - (topScore.get(a.vendor) ?? 0) ||
        a.vendor.localeCompare(b.vendor),
    );
}

export function deprecatingSoon(models: AIModel[], now: Date, days = 90): AIModel[] {
  return models
    .filter((m) => isDeprecatingWithin(m, now, days))
    .sort((a, b) => (daysUntil(a.deprecationDate, now)! - daysUntil(b.deprecationDate, now)!));
}

/* ─────────────────────────── status styling ──────────────────────── */

export const STATUS_META: Record<ModelStatus, { label: string; tone: string }> = {
  Active: { label: "Active", tone: "success" },
  Preview: { label: "Preview", tone: "info" },
  Deprecated: { label: "Deprecated", tone: "warning" },
  Retired: { label: "Retired", tone: "danger" },
};

/* ───────────────────────────── CSV export ────────────────────────── */

export function downloadCSV(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown): string => {
    const s = val === null || val === undefined ? "" : String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
