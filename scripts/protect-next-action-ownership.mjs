import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const legacyGenerators = [
  "scripts/update-loop-dev-docs.mjs",
  "scripts/update-docx-loop-docs.mjs",
  "scripts/update-nextjs-docs.mjs",
  "scripts/update-regulatory-catalog-docs.mjs",
  "scripts/update-structured-share-class-docs.mjs",
  "scripts/update-canonical-schema-docs.mjs",
];

const results = [];

for (const relativePath of legacyGenerators) {
  const filePath = path.join(repoRoot, relativePath);
  const original = await readFile(filePath, "utf8");
  let updated = original;

  const start = updated.indexOf("\nawait writeFile");
  const end = start >= 0 ? updated.indexOf("\n\nconsole.log", start) : -1;

  if (start >= 0 && end > start) {
    const candidate = updated.slice(start, end);
    if (!candidate.includes("NEXT_ACTION.md")) {
      throw new Error(`UNEXPECTED_TOP_LEVEL_WRITE_BLOCK:${relativePath}`);
    }
    updated = `${updated.slice(0, start)}\n${updated.slice(end)}`;
  }

  updated = updated.replaceAll(
    "updated_documents: Object.keys(blocks).length + 1",
    "updated_documents: Object.keys(blocks).length",
  );
  updated = updated.replaceAll(
    "updatedDocuments: Object.keys(blocks).length + 1",
    "updatedDocuments: Object.keys(blocks).length",
  );

  if (updated.includes('path.join(repoRoot, "NEXT_ACTION.md")')) {
    throw new Error(`NEXT_ACTION_WRITE_REMAINS:${relativePath}`);
  }

  const changed = updated !== original;
  if (changed) {
    await writeFile(filePath, updated, "utf8");
  }

  results.push({
    file: relativePath,
    changed,
    nextActionWritePresent: updated.includes("NEXT_ACTION.md"),
  });
}

console.log(
  JSON.stringify(
    {
      status: "PASS",
      ownership: "NEXT_ACTION_IS_CANONICAL_LOOP_CONTROL_ONLY",
      files: results,
    },
    null,
    2,
  ),
);
