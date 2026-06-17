import { NextRequest, NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1";
  const catalog = await getCatalog(forceRefresh);
  return NextResponse.json(catalog, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
