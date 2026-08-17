import assert from "node:assert/strict";
import { createBinaryProspectusExtractor } from "@/server/import/binary-prospectus-extractor";

const docxXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Dénomination du Fonds : FCP Horizon DOCX</w:t></w:r></w:p>
    <w:p><w:r><w:t>Forme juridique : Fonds Commun de Placement (FCP)</w:t></w:r></w:p>
    <w:p><w:r><w:t>Durée : indéterminée</w:t></w:r></w:p>
  </w:body>
</w:document>`;

const docxExtractor = createBinaryProspectusExtractor({
  pdfTextProvider: async () => {
    throw new Error("PDF_PROVIDER_SHOULD_NOT_RUN_FOR_DOCX");
  },
});
const docxProposals = await docxExtractor.extract({
  fileName: "prospectus.docx",
  mediaType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  content: createStoredZip("word/document.xml", Buffer.from(docxXml, "utf8")),
});
const docxByPath = new Map(docxProposals.map((proposal) => [proposal.proposedCanonicalFieldPath, proposal]));
assert.equal(docxByPath.get("fund.legal_name")?.extractedValue, "FCP Horizon DOCX");
assert.equal(docxByPath.get("fund.legal_form")?.extractedValue, "FCP");
assert.equal(docxByPath.get("fund.duration_type")?.extractedValue, "INDEFINITE");

const pdfExtractor = createBinaryProspectusExtractor({
  pdfTextProvider: async () => [
    { page: 1, text: "Dénomination du Fonds : FCP Horizon PDF" },
    { page: 2, text: "Clôture de l'exercice : 31 décembre" },
  ],
});
const pdfProposals = await pdfExtractor.extract({
  fileName: "prospectus.pdf",
  mediaType: "application/pdf",
  content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
});
const pdfByPath = new Map(pdfProposals.map((proposal) => [proposal.proposedCanonicalFieldPath, proposal]));
assert.equal(pdfByPath.get("fund.legal_name")?.extractedValue, "FCP Horizon PDF");
assert.equal(pdfByPath.get("fund.legal_name")?.sourceLocation.page, 1);
assert.equal(pdfByPath.get("accounting.financial_year_end_display")?.sourceLocation.page, 2);

await assert.rejects(
  () => docxExtractor.extract({ fileName: "x.txt", mediaType: "text/plain", content: new Uint8Array() }),
  /IMPORT_UNSUPPORTED_MEDIA_TYPE/,
);

console.log("BINARY_PROSPECTUS_EXTRACTOR_PASS");

function createStoredZip(fileName: string, data: Buffer): Uint8Array {
  const name = Buffer.from(fileName, "utf8");
  const local = Buffer.alloc(30 + name.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(0, 8);
  local.writeUInt32LE(0, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(0, 28);
  name.copy(local, 30);

  const central = Buffer.alloc(46 + name.length);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0, 8);
  central.writeUInt16LE(0, 10);
  central.writeUInt32LE(0, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt16LE(0, 30);
  central.writeUInt16LE(0, 32);
  central.writeUInt16LE(0, 34);
  central.writeUInt16LE(0, 36);
  central.writeUInt32LE(0, 38);
  central.writeUInt32LE(0, 42);
  name.copy(central, 46);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(central.length, 12);
  eocd.writeUInt32LE(local.length + data.length, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([local, data, central, eocd]);
}
