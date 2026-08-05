import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCirc005Matrix } from "../src/adapters/circ005-matrix-loader.js";
import { generateProspectusDraft } from "../src/core/generation-service.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function fixture() {
  const example = path.join(repoRoot, "examples", "united-capital-diamond");
  return {
    seedData: JSON.parse(await readFile(path.join(example, "preloaded-data.json"), "utf8")),
    answers: JSON.parse(await readFile(path.join(example, "answers.json"), "utf8")),
    matrixRows: await loadCirc005Matrix(repoRoot),
    generatedAt: "2026-08-05T02:00:00.000Z",
  };
}

test("le cas d'exemple génère un prospectus et 62 lignes de concordance", async () => {
  const generation = generateProspectusDraft(await fixture());
  assert.match(generation.prospectusMarkdown, /United Capital Diamond/);
  assert.match(generation.prospectusMarkdown, /Risque de taux/);
  assert.equal(generation.concordance.length, 62);
  assert.equal(generation.manifest.ready_for_submission, false);
});

test("le même snapshot produit le même identifiant et le même document", async () => {
  const input = await fixture();
  const first = generateProspectusDraft(input);
  const second = generateProspectusDraft(input);
  assert.equal(first.manifest.generation_id, second.manifest.generation_id);
  assert.equal(first.prospectusMarkdown, second.prospectusMarkdown);
  assert.equal(first.manifest.prospectus_markdown_sha256, second.manifest.prospectus_markdown_sha256);
});
