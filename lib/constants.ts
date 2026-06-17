/**
 * Shared visual constants — restrained MoroHub palette.
 * Only the MoroHub green accent and cool slate neutrals are used; no bright
 * or saturated "jazzy" hues. Multi-series charts step through greens into
 * slate so series stay distinguishable while remaining on-brand.
 */

export const BRAND_GREEN = "#5BAA2E";

/** Ordered palette for multi-series charts (green → slate). */
export const CHART_COLORS = [
  "#5BAA2E", // MoroHub green
  "#2E6F1E", // deep green
  "#7CB342", // light green
  "#4C6B7A", // slate-teal
  "#64748B", // slate
  "#94A3B8", // light slate
];

/** Stable, on-brand colour per vendor (a green→slate ramp, muted throughout). */
export const VENDOR_COLORS: Record<string, string> = {
  OpenAI: "#2E6F1E",
  Anthropic: "#4F9A33",
  Google: "#79B84A",
  Meta: "#5E8A6B",
  "Mistral AI": "#4C6B7A",
  xAI: "#3B4A5C",
  DeepSeek: "#64748B",
  Alibaba: "#94A3B8",
};

const FALLBACK_VENDOR_RAMP = ["#2E6F1E", "#4F9A33", "#79B84A", "#5E8A6B", "#4C6B7A", "#3B4A5C", "#64748B", "#94A3B8"];

/** Deterministic colour for any vendor, including ones not in the static map. */
export function vendorColor(vendor: string): string {
  if (VENDOR_COLORS[vendor]) return VENDOR_COLORS[vendor];
  let hash = 0;
  for (let i = 0; i < vendor.length; i++) hash = (hash * 31 + vendor.charCodeAt(i)) >>> 0;
  return FALLBACK_VENDOR_RAMP[hash % FALLBACK_VENDOR_RAMP.length];
}

/** Radar axes for the per-model benchmark charts. */
export const BENCHMARK_AXES = [
  { key: "reasoning", label: "Reasoning" },
  { key: "coding", label: "Coding" },
  { key: "math", label: "Math" },
  { key: "multilingual", label: "Multilingual" },
  { key: "vision", label: "Vision" },
] as const;
