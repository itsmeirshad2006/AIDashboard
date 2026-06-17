import type { ComponentType } from "react";
import {
  Award,
  BadgeCheck,
  CalendarClock,
  Calculator,
  Gauge,
  Grid3x3,
  LayoutDashboard,
  Radar,
  Scale,
  ShieldCheck,
  Sparkles,
  Table2,
  Tags,
} from "lucide-react";

export type SectionId =
  | "overview"
  | "recommend"
  | "compare"
  | "sidebyside"
  | "calculator"
  | "capabilities"
  | "benchmarks"
  | "value"
  | "lifecycle"
  | "categories"
  | "compliance"
  | "certifications"
  | "performance";

export interface SectionDef {
  id: SectionId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  group: "Insights" | "Compare" | "Governance";
  description: string;
}

export const SECTIONS: SectionDef[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "Insights", description: "KPIs & quick answers" },
  { id: "recommend", label: "AI Recommender", icon: Sparkles, group: "Insights", description: "Best-fit model for your needs" },
  { id: "compare", label: "Compare Table", icon: Table2, group: "Compare", description: "Searchable master table" },
  { id: "sidebyside", label: "Side-by-Side", icon: Scale, group: "Compare", description: "Compare 2–4 models" },
  { id: "calculator", label: "Cost Calculator", icon: Calculator, group: "Compare", description: "Estimate monthly spend" },
  { id: "capabilities", label: "Capability Matrix", icon: Grid3x3, group: "Compare", description: "Yes/no feature grid" },
  { id: "benchmarks", label: "Benchmarks", icon: Radar, group: "Insights", description: "Leaders & radar charts" },
  { id: "value", label: "Value for Money", icon: Gauge, group: "Insights", description: "Performance per dollar" },
  { id: "lifecycle", label: "Lifecycle", icon: CalendarClock, group: "Governance", description: "Release → retirement" },
  { id: "categories", label: "Categories", icon: Tags, group: "Insights", description: "Models by use case" },
  { id: "compliance", label: "Compliance", icon: ShieldCheck, group: "Governance", description: "SOC2 / ISO / HIPAA / GDPR" },
  { id: "certifications", label: "Certifications", icon: BadgeCheck, group: "Governance", description: "Per-model attestations" },
  { id: "performance", label: "Performance", icon: Award, group: "Compare", description: "Latency, throughput, limits" },
];

export const SECTION_GROUPS: SectionDef["group"][] = ["Insights", "Compare", "Governance"];
