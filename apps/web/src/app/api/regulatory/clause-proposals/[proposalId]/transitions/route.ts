import { NextResponse } from "next/server";
import { clauseProposalRepository } from "@/server/clauses";
import { clauseProposalError } from "@/app/api/regulatory/clause-proposals/route";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ proposalId: string }> },
) {
  const [{ proposalId }, body] = await Promise.all([
    params,
    request.json().catch(() => null) as Promise<Record<string, unknown> | null>,
  ]);
  if (!body) return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  const event = String(body.event ?? "").trim();
  const expectedVersion = Number(body.expectedVersion);
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return NextResponse.json({ error: "expectedVersion doit être un entier positif." }, { status: 422 });
  }
  if (!['REQUEST_LEGAL_REVIEW', 'APPROVE'].includes(event)) {
    return NextResponse.json(
      { error: "Seules les transitions REQUEST_LEGAL_REVIEW et APPROVE sont exposées." },
      { status: 422 },
    );
  }

  try {
    const proposal = event === "REQUEST_LEGAL_REVIEW"
      ? await clauseProposalRepository.requestLegalReview({ proposalId, expectedVersion })
      : await clauseProposalRepository.approve({ proposalId, expectedVersion });
    return NextResponse.json({
      proposal,
      globalClauseActivationAllowed: false,
      readyForSubmission: false,
    });
  } catch (error) {
    return clauseProposalError(error);
  }
}
