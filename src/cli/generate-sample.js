import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCirc005Matrix } from "../adapters/circ005-matrix-loader.js";
import { generateProspectusDraft } from "../core/generation-service.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const exampleDirectory = path.join(repoRoot, "examples", "united-capital-diamond");
const outputDirectory = path.join(repoRoot, "examples", "generated", "united-capital-diamond");

const [seedData, answers, matrixRows] = await Promise.all([
  readJson(path.join(exampleDirectory, "preloaded-data.json")),
  readJson(path.join(exampleDirectory, "answers.json")),
  loadCirc005Matrix(repoRoot),
]);

const generation = generateProspectusDraft({ seedData, answers, matrixRows });

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(path.join(outputDirectory, "prospectus-draft.md"), generation.prospectusMarkdown, "utf8"),
  writeJson(path.join(outputDirectory, "canonical-data.json"), generation.canonicalData),
  writeJson(path.join(outputDirectory, "questionnaire-state.json"), generation.questionnaireState),
  writeJson(path.join(outputDirectory, "control-report.json"), generation.validation),
  writeJson(path.join(outputDirectory, "concordance.json"), generation.concordance),
  writeJson(path.join(outputDirectory, "document-model.json"), generation.documentModel),
  writeJson(path.join(outputDirectory, "answer-log.json"), generation.answerLog),
  writeJson(path.join(outputDirectory, "generation-manifest.json"), generation.manifest),
]);

console.log(JSON.stringify({
  generation_id: generation.manifest.generation_id,
  output_directory: path.relative(repoRoot, outputDirectory),
  validation_status: generation.validation.status,
  validation_counts: generation.validation.counts,
  requirements: generation.concordance.length,
  applicable_questions: generation.questionnaireState.applicable_questions.length,
  ready_for_compliance_review: generation.manifest.ready_for_compliance_review,
  ready_for_submission: generation.manifest.ready_for_submission,
}, null, 2));

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
