import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCirc005Matrix } from "../src/adapters/circ005-matrix-loader.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("les quatre matrices chargent 62 exigences uniques", async () => {
  const rows = await loadCirc005Matrix(repoRoot);
  assert.equal(rows.length, 62);
  assert.equal(new Set(rows.map((row) => row.requirement_id)).size, 62);
  assert.equal(new Set(rows.map((row) => row.question_id).filter(Boolean)).size, 62);
});
