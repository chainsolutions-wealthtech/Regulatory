import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = "docs/05-quality/DOCX_VISUAL_INSPECTION_2026-08-05.md";
const block = `## Inspection visuelle DOCX clôturée — 2026-08-05

- pages rendues et inspectées : \`10/10\` ;
- première anomalie : puces de risques invisibles — \`CORRECTED\` ;
- seconde anomalie : ligne de traçabilité fractionnée entre pages — \`CORRECTED\` ;
- seconde inspection complète : \`PASS\` ;
- limitation déclarée : densité élevée de l’annexe technique, sans texte coupé ni ligne fractionnée ;
- rapport : \`${reportPath}\` ;
- nature du verdict : qualité structurelle et visuelle d’un document de pré-conformité, non validation juridique ou réglementaire.`;

for (const file of [
  "STATUS.md",
  "CURRENT_ITERATION.md",
  "WORK_LOG.md",
  "SUIVI.md",
  "TODO.md",
  "CHANGELOG.md",
  "HANDOFF.md",
]) {
  await upsertBlock(file, "LOOP-DEV-001-DOCX-VISUAL-QA", block);
}

console.log(JSON.stringify({
  updated_documents: 7,
  pages_inspected: 10,
  result: "PASS_WITH_DECLARED_DENSITY_LIMITATION",
  report: reportPath,
}, null, 2));

async function upsertBlock(relativePath, id, markdown) {
  const filePath = path.join(repoRoot, relativePath);
  const start = `<!-- AUTO:${id}:START -->`;
  const end = `<!-- AUTO:${id}:END -->`;
  const wrapped = `${start}\n${markdown.trim()}\n${end}`;
  let current = await readFile(filePath, "utf8");
  const expression = new RegExp(`${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}`, "m");
  current = expression.test(current)
    ? current.replace(expression, wrapped)
    : `${current.trimEnd()}\n\n${wrapped}\n`;
  await writeFile(filePath, current, "utf8");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
