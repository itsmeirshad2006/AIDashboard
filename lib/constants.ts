/**
 * Shared visual constants. Chart colours are chosen to read well in both
 * light and dark themes and to harmonise with the MoroHub green accent.
 */

export const BRAND_GREEN = "#5BAA2E";

/** Ordered palette for multi-series charts. */
export const CHART_COLORS = [
  "#5BAA2E", // brand green
  "#2563EB", // blue
  "#0EA5A4", // teal
  "#F59E0B", // amber
  "#7C3AED", // violet
  "#E11D48", // rose
  "#0891B2", // cyan
  "#65A30D", // lime
];

/** Stable colour per vendor for legends and badges. */
export const VENDOR_COLORS: Record<string, string> = {
  OpenAI: "#10A37F",
  Anthropic: "#D97757",
  Google: "#4285F4",
  Meta: "#0668E1",
  "Mistral AI": "#FA520F",
  xAI: "#111827",
  DeepSeek: "#4D6BFE",
};

export function vendorColor(vendor: string): string {
  return VENDOR_COLORS[vendor] ?? "#64748B";
}

/** Radar axes for the per-model benchmark charts. */
export const BENCHMARK_AXES = [
  { key: "reasoning", label: "Reasoning" },
  { key: "coding", label: "Coding" },
  { key: "math", label: "Math" },
  { key: "multilingual", label: "Multilingual" },
  { key: "vision", label: "Vision" },
] as const;
