/**
 * Single source of truth for the shape of every AI model record.
 * Every dashboard view is a filter / sort / visualization over `AIModel[]`.
 */

export type ModelStatus = "Active" | "Preview" | "Deprecated" | "Retired";

export type CategoryTag =
  | "Frontier"
  | "Reasoning"
  | "Coding"
  | "Multimodal"
  | "Long Context"
  | "Budget"
  | "Fast / Realtime"
  | "Open Source"
  | "Enterprise";

export interface Pricing {
  /** USD per 1M input tokens. */
  inputPer1M: number;
  /** USD per 1M output tokens. */
  outputPer1M: number;
  /** USD per 1M cached input tokens, when supported. */
  cachedInputPer1M?: number;
  /** Fractional discount for batch/async usage, e.g. 0.5 === 50% off. */
  batchDiscount?: number;
}

export interface Multimodal {
  text: boolean;
  image: boolean;
  audio: boolean;
  video: boolean;
}

export interface Capabilities {
  functionCalling: boolean;
  /** Native JSON / structured output mode. */
  structuredOutput: boolean;
  streaming: boolean;
  fineTuning: boolean;
  /** Extended thinking / step-by-step reasoning mode. */
  reasoningMode: boolean;
}

export interface Deployment {
  api: boolean;
  azure: boolean;
  awsBedrock: boolean;
  gcpVertex: boolean;
  selfHostable: boolean;
}

/** Normalized 0–100 scores (higher is better). 0 === capability not offered. */
export interface Benchmarks {
  reasoning: number;
  coding: number;
  math: number;
  multilingual: number;
  vision: number;
}

export interface Compliance {
  soc2: boolean;
  iso27001: boolean;
  hipaa: boolean;
  gdpr: boolean;
  /** Regional data-residency controls available. */
  dataResidency: boolean;
  /** Whether the provider trains on your data by default (lower is better). */
  trainsOnYourData: boolean;
}

export interface RateLimits {
  /** Requests per minute (representative default tier). */
  rpm: number;
  /** Tokens per minute (representative default tier). */
  tpm: number;
}

export interface AIModel {
  id: string;
  name: string;
  vendor: string;
  version: string;
  status: ModelStatus;
  /** ISO date (YYYY-MM-DD). */
  releaseDate: string;
  /** ISO date or null if no retirement is scheduled. */
  deprecationDate: string | null;
  /** Training data knowledge cutoff (label). */
  knowledgeCutoff: string;
  pricing: Pricing;
  /** Max context window in tokens. */
  contextWindow: number;
  maxOutputTokens: number;
  multimodal: Multimodal;
  capabilities: Capabilities;
  deployment: Deployment;
  openSource: boolean;
  license: string;
  benchmarks: Benchmarks;
  bestUseCases: string[];
  categories: CategoryTag[];
  compliance: Compliance;
  /** Representative average latency to first response, ms. */
  latencyMsAvg: number;
  /** Representative streaming throughput, tokens/sec. */
  throughputTokensPerSec: number;
  rateLimits: RateLimits;
  certifications: string[];
  notes?: string;
}
