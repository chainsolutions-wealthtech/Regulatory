import { NextResponse } from "next/server";
import {
  CATALOG_METADATA,
  QUESTION_GROUPS,
  REGULATORY_REQUIREMENTS,
} from "@/domain/regulatory-catalog";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    metadata: CATALOG_METADATA,
    groups: QUESTION_GROUPS,
    requirements: REGULATORY_REQUIREMENTS,
  });
}
