import assert from "node:assert/strict";
import { createDeterministicProspectusTextExtractor } from "@/server/import/deterministic-prospectus-text-extractor";

const extractor = createDeterministicProspectusTextExtractor();

const text = [
  "Dénomination du Fonds : FCP Horizon UEMOA",
  "Forme juridique : Fonds Commun de Placement (FCP)",
  "Durée : indéterminée",
  "Clôture de l'exercice : 31 décembre",
].join("\n");

const proposals = extractor.extractText({ text, page: 3 });
const byPath = new Map(proposals.map((proposal) => [proposal.proposedCanonicalFieldPath, proposal]));

assert.equal(byPath.get("fund.legal_name")?.extractedValue, "FCP Horizon UEMOA");
assert.equal(byPath.get("fund.legal_form")?.extractedValue, "FCP");
assert.equal(byPath.get("fund.duration_type")?.extractedValue, "INDEFINITE");
assert.equal(byPath.get("accounting.financial_year_end_display")?.extractedValue, "31 décembre");

for (const proposal of proposals) {
  assert.equal(proposal.sourceLocation.page, 3);
  assert.ok(proposal.sourceLocation.textAnchor);
  assert.ok((proposal.confidence ?? 0) > 0);
  assert.ok((proposal.confidence ?? 1) < 1);
}

const ambiguous = extractor.extractText({
  text: [
    "Dénomination du Fonds : FCP Alpha",
    "Dénomination du Fonds : FCP Beta",
  ].join("\n"),
});
assert.equal(
  ambiguous.some((proposal) => proposal.proposedCanonicalFieldPath === "fund.legal_name"),
  false,
);

const unsupportedLabels = extractor.extractText({
  text: "Ce document présente un fonds nommé Gamma mais ne contient aucun libellé canonique reconnu.",
});
assert.deepEqual(unsupportedLabels, []);

console.log("DETERMINISTIC_PROSPECTUS_TEXT_EXTRACTOR_PASS");
