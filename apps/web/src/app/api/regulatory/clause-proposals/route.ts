import { NextResponse } from "next/server";
import { clauseProposalRepository } from "@/server/clauses";

export const runtime = "nodejs";

export async function GET() {
  try {
    const proposals = await clauseProposalRepository.list();
    return NextResponse.json({
      proposals,
      globalClauseActivationAllowed: false,
      readyForSubmission: false,
    });
  } catch (error) {
    return clauseProposalError(error);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  const sourceClauseId = String(body.sourceClauseId ?? "").trim();
  const wording = String(body.wording ?? "").trim();
  if (!sourceClauseId || !wording) {
    return NextResponse.json(
      { error: "sourceClauseId et wording sont obligatoires." },
      { status: 422 },
    );
  }
  try {
    const proposal = await clauseProposalRepository.create({ sourceClauseId, wording });
    return NextResponse.json({
      proposal,
      globalClauseActivationAllowed: false,
      readyForSubmission: false,
    }, { status: 201 });
  } catch (error) {
    return clauseProposalError(error);
  }
}

export function clauseProposalError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur de proposition de clause.";
  if (message.startsWith("CLAUSE_PROPOSAL_REPOSITORY_UNAVAILABLE")) {
    return NextResponse.json({ error: message }, { status: 503 });
  }
  if (message.startsWith("OIDC_") || message.startsWith("IDENTITY_")) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (
    message.startsWith("ORGANIZATION_MEMBERSHIP_REQUIRED") ||
    message.includes("AUTHORIZATION_DENIED") ||
    message.includes("DENIED_SEPARATION_OF_DUTIES")
  ) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  if (
    message.startsWith("CLAUSE_PROPOSAL_NOT_FOUND") ||
    message.startsWith("CLAUSE_PROPOSAL_SOURCE_CLAUSE_NOT_FOUND")
  ) {
    return NextResponse.json({ error: message }, { status: 404 });
  }
  if (
    message.startsWith("CLAUSE_PROPOSAL_VERSION_CONFLICT") ||
    message.startsWith("CLAUSE_TRANSITION_DENIED")
  ) {
    return NextResponse.json({ error: message }, { status: 409 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}
