import { NextResponse } from "next/server";
import { clauseProposalRepository } from "@/server/clauses";
import { clauseProposalError } from "@/app/api/regulatory/clause-proposals/route";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ proposalId: string }> },
) {
  const { proposalId } = await params;
  try {
    const proposal = await clauseProposalRepository.get(proposalId);
    if (!proposal) return NextResponse.json({ error: "CLAUSE_PROPOSAL_NOT_FOUND" }, { status: 404 });
    return NextResponse.json({
      proposal,
      globalClauseActivationAllowed: false,
      readyForSubmission: false,
    });
  } catch (error) {
    return clauseProposalError(error);
  }
}
