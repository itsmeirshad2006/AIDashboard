import { MODELS as FALLBACK_MODELS } from "@/data/models";
import type { AIModel, AgenticTier, CategoryTag, ModelStatus } from "@/lib/types";

/**
 * Server-only: builds the model catalog from the Gemini API, validates and
 * normalizes the response into AIModel[], and caches it. On any failure
 * (missing key, quota, malformed output) it returns the curated static dataset
 * so the dashboard always renders. Imported only by route handlers.
 */

export type CatalogSource = "gemini" | "fallback";

export interface Catalog {
  models: AIModel[];
  source: CatalogSource;
  generatedAt: string;
  geminiModel: string | null;
  note: string;
  error?: string;
}

const DEFAULT_MODEL = "gemini-2.5-flash";
const MODEL_COUNT = 14;
const TTL_MS = 6 * 60 * 60 * 1000; // refresh at most every 6 hours
const REQUEST_TIMEOUT_MS = 55_000;

let cache: { catalog: Catalog; ts: number } | null = null;
let inFlight: Promise<Catalog> | null = null;

/* ─────────────────────────── coercion helpers ─────────────────────────── */

const STATUSES: ModelStatus[] = ["Active", "Preview", "Deprecated", "Retired"];
const AGENTIC: AgenticTier[] = ["Advanced", "Medium", "Basic"];
const CATEGORIES: CategoryTag[] = [
  "Frontier", "Reasoning", "Coding", "Multimodal", "Long Context", "Budget",
  "Fast / Realtime", "Open Source", "Enterprise", "Agentic", "Multilingual",
];

function asBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return /^(true|yes|y|1)$/i.test(v.trim());
  return false;
}
function asNum(v: unknown, def = 0): number {
  const n = typeof v === "string" ? Number(v.replace(/[^0-9.\-]/g, "")) : Number(v);
  return Number.isFinite(n) ? n : def;
}
function asStr(v: unknown, def = ""): string {
  if (typeof v === "string") return v.trim();
  return v == null ? def : String(v);
}
function asScore(v: unknown): number {
  return Math.max(0, Math.min(100, Math.round(asNum(v))));
}
function asInt(v: unknown, def = 0): number {
  return Math.max(0, Math.round(asNum(v, def)));
}
function slug(name: string, idx: number): string {
  const s = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s || `model-${idx}`;
}
function isoDateOrNull(v: unknown): string | null {
  const s = asStr(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function normalizeModel(raw: Record<string, unknown>, idx: number): AIModel | null {
  const name = asStr(raw.name);
  const vendor = asStr(raw.vendor);
  if (!name || !vendor) return null;

  const p = (raw.pricing ?? {}) as Record<string, unknown>;
  const selfHosted = asBool(p.selfHosted);
  const mm = (raw.multimodal ?? {}) as Record<string, unknown>;
  const cap = (raw.capabilities ?? {}) as Record<string, unknown>;
  const dep = (raw.deployment ?? {}) as Record<string, unknown>;
  const bench = (raw.benchmarks ?? {}) as Record<string, unknown>;
  const comp = (raw.compliance ?? {}) as Record<string, unknown>;
  const rl = (raw.rateLimits ?? {}) as Record<string, unknown>;

  const status = (STATUSES.includes(asStr(raw.status) as ModelStatus) ? raw.status : "Active") as ModelStatus;
  const agentic = AGENTIC.includes(asStr(raw.agenticTier) as AgenticTier)
    ? (raw.agenticTier as AgenticTier)
    : undefined;

  let categories = Array.isArray(raw.categories)
    ? (raw.categories.map((c) => asStr(c)).filter((c) => CATEGORIES.includes(c as CategoryTag)) as CategoryTag[])
    : [];
  categories = Array.from(new Set(categories));
  if (categories.length === 0) categories = ["Enterprise"];

  const useCases = Array.isArray(raw.bestUseCases)
    ? raw.bestUseCases.map((c) => asStr(c)).filter(Boolean).slice(0, 5)
    : [];

  const certs = Array.isArray(raw.certifications)
    ? raw.certifications.map((c) => asStr(c)).filter(Boolean).slice(0, 8)
    : [];

  const rankRaw = raw.overallRank;
  const overallRank = rankRaw == null ? null : asInt(rankRaw) || null;

  return {
    id: slug(name, idx),
    name,
    vendor,
    version: asStr(raw.version, name),
    status,
    releaseDate: isoDateOrNull(raw.releaseDate) ?? "2025-01-01",
    deprecationDate: isoDateOrNull(raw.deprecationDate),
    knowledgeCutoff: asStr(raw.knowledgeCutoff, "—"),
    pricing: {
      inputPer1M: selfHosted ? 0 : asNum(p.inputPer1M),
      outputPer1M: selfHosted ? 0 : asNum(p.outputPer1M),
      cachedInputPer1M: p.cachedInputPer1M != null ? asNum(p.cachedInputPer1M) : undefined,
      batchDiscount: p.batchDiscount != null ? Math.max(0, Math.min(1, asNum(p.batchDiscount))) : undefined,
      label: p.label != null ? asStr(p.label) : selfHosted ? "Self-host" : undefined,
      selfHosted: selfHosted || undefined,
    },
    contextWindow: asInt(raw.contextWindow, 128_000),
    maxOutputTokens: asInt(raw.maxOutputTokens, 8_192),
    multimodal: {
      text: mm.text != null ? asBool(mm.text) : true,
      image: asBool(mm.image),
      audio: asBool(mm.audio),
      video: asBool(mm.video),
    },
    capabilities: {
      functionCalling: asBool(cap.functionCalling),
      structuredOutput: asBool(cap.structuredOutput),
      streaming: cap.streaming != null ? asBool(cap.streaming) : true,
      fineTuning: asBool(cap.fineTuning),
      reasoningMode: asBool(cap.reasoningMode),
    },
    deployment: {
      api: dep.api != null ? asBool(dep.api) : true,
      azure: asBool(dep.azure),
      awsBedrock: asBool(dep.awsBedrock),
      gcpVertex: asBool(dep.gcpVertex),
      selfHostable: asBool(dep.selfHostable) || selfHosted,
    },
    openSource: asBool(raw.openSource),
    license: asStr(raw.license, "Proprietary (commercial)"),
    benchmarks: {
      reasoning: asScore(bench.reasoning),
      coding: asScore(bench.coding),
      math: asScore(bench.math),
      multilingual: asScore(bench.multilingual),
      vision: asScore(bench.vision),
    },
    bestUseCases: useCases.length ? useCases : ["General-purpose tasks"],
    categories,
    agenticTier: agentic,
    overallRank,
    benchmarkStrength: raw.benchmarkStrength != null ? asStr(raw.benchmarkStrength) : undefined,
    compliance: {
      soc2: asBool(comp.soc2),
      iso27001: asBool(comp.iso27001),
      hipaa: asBool(comp.hipaa),
      gdpr: asBool(comp.gdpr),
      dataResidency: asBool(comp.dataResidency),
      trainsOnYourData: asBool(comp.trainsOnYourData),
    },
    latencyMsAvg: asInt(raw.latencyMsAvg, 600),
    throughputTokensPerSec: asInt(raw.throughputTokensPerSec, 100),
    rateLimits: {
      rpm: asInt(rl.rpm, 1_000),
      tpm: asInt(rl.tpm, 1_000_000),
    },
    certifications: certs,
  };
}

/* ───────────────────────────── prompt ────────────────────────────── */

function buildPrompt(today: string): string {
  return [
    `Today is ${today}. Produce a JSON catalog of the ${MODEL_COUNT} most important commercial AI models`,
    "available right now — a realistic mix of frontier and budget models across OpenAI, Anthropic,",
    "Google, Meta, Mistral, xAI, DeepSeek, Alibaba and similar vendors. Use realistic, current specs.",
    "",
    'Return ONLY minified JSON of the form { "models": Model[] }, where each Model has exactly:',
    'name, vendor, version, status ("Active"|"Preview"|"Deprecated"|"Retired"),',
    "releaseDate (YYYY-MM-DD), deprecationDate (YYYY-MM-DD or null), knowledgeCutoff (e.g. \"Oct 2025\"),",
    "pricing { inputPer1M:number, outputPer1M:number, cachedInputPer1M?:number, batchDiscount?:0..1, label?:string, selfHosted?:boolean },",
    "contextWindow:int, maxOutputTokens:int,",
    "multimodal { text, image, audio, video }:boolean,",
    "capabilities { functionCalling, structuredOutput, streaming, fineTuning, reasoningMode }:boolean,",
    "deployment { api, azure, awsBedrock, gcpVertex, selfHostable }:boolean,",
    "openSource:boolean, license:string,",
    "benchmarks { reasoning, coding, math, multilingual, vision }: integers 0-100 (vision 0 if no vision),",
    "bestUseCases: string[3-4],",
    'categories: subset of ["Frontier","Reasoning","Coding","Multimodal","Long Context","Budget","Fast / Realtime","Open Source","Enterprise","Agentic","Multilingual"],',
    'agenticTier ("Advanced"|"Medium"|"Basic"),',
    "overallRank: integer rank for the top 8 by overall capability (1=best), null for the rest,",
    'benchmarkStrength: short string for ranked models (e.g. "Coding"),',
    "compliance { soc2, iso27001, hipaa, gdpr, dataResidency, trainsOnYourData }:boolean,",
    "latencyMsAvg:int, throughputTokensPerSec:int, rateLimits { rpm:int, tpm:int }, certifications: string[].",
    "",
    "Rules: include >=3 models with contextWindow >= 1000000; include several open-source/self-hostable",
    "models (set pricing.selfHosted=true, inputPer1M=0, outputPer1M=0, label \"Self-host\"); include at least",
    "one model whose deprecationDate is within 90 days of today; make benchmark scores consistent with",
    "overallRank. No markdown, no commentary — JSON only.",
  ].join("\n");
}

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("Gemini did not return parseable JSON.");
  }
}

/* ─────────────────────────── Gemini call ─────────────────────────── */

async function generateFromGemini(): Promise<AIModel[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const today = new Date().toISOString().slice(0, 10);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: buildPrompt(today) }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
      maxOutputTokens: 20_000,
      // Disable extended thinking for fast, deterministic structured output.
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini API ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("Empty response from Gemini.");

  const parsed = extractJson(text) as { models?: unknown[] };
  const rawModels = Array.isArray(parsed.models) ? parsed.models : Array.isArray(parsed) ? parsed : [];
  const models = rawModels
    .map((m, i) => normalizeModel((m ?? {}) as Record<string, unknown>, i))
    .filter((m): m is AIModel => m !== null);

  // De-duplicate by id (keep first occurrence).
  const seen = new Set<string>();
  const unique = models.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));

  if (unique.length < 6) throw new Error(`Only ${unique.length} valid models parsed.`);
  return unique;
}

function fallbackCatalog(error?: string): Catalog {
  return {
    models: FALLBACK_MODELS,
    source: "fallback",
    generatedAt: new Date().toISOString(),
    geminiModel: null,
    note:
      "Showing a curated reference snapshot. Live data from Gemini is unavailable — verify all specs with each vendor.",
    error,
  };
}

/** Returns the catalog, using a cached Gemini result when fresh. */
export async function getCatalog(forceRefresh = false): Promise<Catalog> {
  if (!forceRefresh && cache && Date.now() - cache.ts < TTL_MS) return cache.catalog;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const models = await generateFromGemini();
      const catalog: Catalog = {
        models,
        source: "gemini",
        generatedAt: new Date().toISOString(),
        geminiModel: process.env.GEMINI_MODEL || DEFAULT_MODEL,
        note: "Live catalog generated by the Gemini API. Specifications are AI-generated — verify with each vendor.",
      };
      cache = { catalog, ts: Date.now() };
      return catalog;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const catalog = fallbackCatalog(message);
      // Cache the fallback briefly so we do not hammer a failing API on every request.
      cache = { catalog, ts: Date.now() - TTL_MS + 60_000 };
      return catalog;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
