import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MODELS } from "@/data/models";
import { blendedCostPer1M } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUIREMENT_LENGTH = 2000;

export interface RecommendationItem {
  modelId: string;
  modelName: string;
  vendor: string;
  matchScore: number;
  reasons: string[];
  watchOuts: string[];
}

export interface RecommendationResponse {
  summary: string;
  recommendations: RecommendationItem[];
}

/** Compact, prompt-friendly projection of the catalog (keeps tokens reasonable). */
function buildCatalog() {
  return MODELS.map((m) => ({
    id: m.id,
    name: m.name,
    vendor: m.vendor,
    status: m.status,
    deprecationDate: m.deprecationDate,
    priceInputPer1M: m.pricing.inputPer1M,
    priceOutputPer1M: m.pricing.outputPer1M,
    blendedPer1M: Number(blendedCostPer1M(m).toFixed(3)),
    contextWindow: m.contextWindow,
    maxOutputTokens: m.maxOutputTokens,
    multimodal: m.multimodal,
    capabilities: m.capabilities,
    deployment: m.deployment,
    openSource: m.openSource,
    license: m.license,
    benchmarks: m.benchmarks,
    categories: m.categories,
    compliance: m.compliance,
    latencyMsAvg: m.latencyMsAvg,
    throughputTokensPerSec: m.throughputTokensPerSec,
    bestUseCases: m.bestUseCases,
  }));
}

function buildPrompt(requirement: string): string {
  const catalog = JSON.stringify(buildCatalog());
  return [
    "You are an impartial AI model selection advisor for an enterprise.",
    "Use ONLY the models in the catalog below. Never invent models or specs.",
    "",
    "Pick the 3 best-fit models for the user's requirement, ranked best first.",
    "Weigh every relevant constraint the user states or implies: budget / cost,",
    "use case (e.g. coding, reasoning, multimodal, RAG, realtime), context-window",
    "needs, latency/throughput, compliance (SOC2/ISO27001/HIPAA/GDPR/data residency,",
    "whether the provider trains on your data), deployment target (API/Azure/Bedrock/",
    "Vertex/self-hosted), open-source needs, and lifecycle (avoid recommending models",
    "whose status is Deprecated or Retired unless explicitly asked; never recommend",
    "a model that is being retired soon for new production work).",
    "",
    "For each pick give 2-4 concrete, specific reasons that reference the user's",
    "stated constraints and the model's actual catalog values (cite numbers like price",
    "or context window). Also give 0-2 honest 'watchOuts' (trade-offs/risks).",
    'matchScore is 0-100 reflecting fit. Use the model "id" exactly as given.',
    "",
    "Return ONLY valid minified JSON matching exactly this TypeScript type — no markdown:",
    "{ summary: string; recommendations: { modelId: string; modelName: string; vendor: string; matchScore: number; reasons: string[]; watchOuts: string[] }[] }",
    "",
    `CATALOG = ${catalog}`,
    "",
    `USER REQUIREMENT: """${requirement}"""`,
  ].join("\n");
}

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall back to the first {...} block in the response.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Model did not return parseable JSON.");
  }
}

function sanitize(parsed: unknown): RecommendationResponse {
  const obj = (parsed ?? {}) as Record<string, unknown>;
  const rawList = Array.isArray(obj.recommendations) ? obj.recommendations : [];
  const validIds = new Set(MODELS.map((m) => m.id));

  const recommendations: RecommendationItem[] = rawList
    .map((r) => {
      const item = (r ?? {}) as Record<string, unknown>;
      const modelId = String(item.modelId ?? "");
      const match = MODELS.find((m) => m.id === modelId) ??
        MODELS.find((m) => m.name.toLowerCase() === String(item.modelName ?? "").toLowerCase());
      if (!match) return null;
      return {
        modelId: match.id,
        modelName: match.name,
        vendor: match.vendor,
        matchScore: Math.max(0, Math.min(100, Math.round(Number(item.matchScore) || 0))),
        reasons: Array.isArray(item.reasons) ? item.reasons.map(String).slice(0, 4) : [],
        watchOuts: Array.isArray(item.watchOuts) ? item.watchOuts.map(String).slice(0, 3) : [],
      } satisfies RecommendationItem;
    })
    .filter((x): x is RecommendationItem => x !== null && validIds.has(x.modelId));

  return {
    summary: typeof obj.summary === "string" ? obj.summary : "",
    recommendations,
  };
}

export async function POST(req: NextRequest) {
  let requirement = "";
  try {
    const body = await req.json();
    requirement = String(body?.requirement ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!requirement) {
    return NextResponse.json(
      { error: "Please describe your requirement so we can recommend a model." },
      { status: 400 },
    );
  }
  if (requirement.length > MAX_REQUIREMENT_LENGTH) {
    requirement = requirement.slice(0, MAX_REQUIREMENT_LENGTH);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "The recommendation engine is not configured. Set GEMINI_API_KEY in your environment (.env.local locally, or Vercel Project Settings → Environment Variables).",
      },
      { status: 503 },
    );
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
    });

    const result = await model.generateContent(buildPrompt(requirement));
    const text = result.response.text();
    const data = sanitize(extractJson(text));

    if (data.recommendations.length === 0) {
      return NextResponse.json(
        { error: "No suitable models matched that requirement. Try adding more detail." },
        { status: 200 },
      );
    }
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `The recommendation service failed: ${message}. Please try again.` },
      { status: 502 },
    );
  }
}
