import { NextResponse } from "next/server";
import { CLAUSE_CATALOG, CLAUSE_CATALOG_METADATA } from "@/domain/clause-catalog";

export async function GET() {
  return NextResponse.json({
    ...CLAUSE_CATALOG_METADATA,
    clauses: CLAUSE_CATALOG,
    readOnly: true,
    approvalAllowed: false,
    automaticActivationAllowed: false,
    readyForSubmission: false,
  });
}
