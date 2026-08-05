import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { loadCirc005Matrix } from "../adapters/circ005-matrix-loader.js";
import { generateFromWebCanonicalSnapshot } from "../adapters/web-canonical-snapshot-adapter.js";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = parseArgs(process.argv.slice(2));
const snapshotPath = path.resolve(args.snapshot);
const outputDirectory = path.resolve(args.output);
const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
const matrixRows = await loadCirc005Matrix(repoRoot);
const generation = generateFromWebCanonicalSnapshot({
  snapshot,
  matrixRows,
  generatedAt: args.generatedAt,
});

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeJson(path.join(outputDirectory, "canonical-snapshot.json"), snapshot),
  writeFile(path.join(outputDirectory, "prospectus-draft.md"), generation.prospectusMarkdown, "utf8"),
  writeJson(path.join(outputDirectory, "canonical-data.json"), generation.canonicalData),
  writeJson(path.join(outputDirectory, "questionnaire-state.json"), generation.questionnaireState),
  writeJson(path.join(outputDirectory, "control-report.json"), generation.validation),
  writeJson(path.join(outputDirectory, "concordance.json"), generation.concordance),
  writeJson(path.join(outputDirectory, "document-model.json"), generation.documentModel),
  writeJson(path.join(outputDirectory, "answer-log.json"), generation.answerLog),
  writeJson(path.join(outputDirectory, "generation-manifest.json"), generation.manifest),
]);

const modelPath = path.join(outputDirectory, "document-model.json");
const generationManifestPath = path.join(outputDirectory, "generation-manifest.json");
const docxPath = path.join(outputDirectory, "prospectus-draft.docx");
const docxManifestPath = path.join(outputDirectory, "docx-manifest.json");

await runPython("scripts/generate_docx.py", [
  "--model",
  modelPath,
  "--manifest",
  generationManifestPath,
  "--output",
  docxPath,
  "--docx-manifest",
  docxManifestPath,
]);
await runPython("scripts/optimize_docx_layout.py", [
  "--docx",
  docxPath,
  "--manifest",
  docxManifestPath,
]);
const validationOutput = await runPython("scripts/validate_docx.py", [
  "--docx",
  docxPath,
  "--manifest",
  docxManifestPath,
]);
const docxValidation = parseLastJsonObject(validationOutput.stdout);
await writeJson(path.join(outputDirectory, "docx-validation.json"), docxValidation);

const result = {
  generation_id: generation.manifest.generation_id,
  generated_at: generation.manifest.generated_at,
  output_directory: outputDirectory,
  web_project_id: snapshot.projectId,
  web_project_version: snapshot.projectVersion,
  web_snapshot_sha256: generation.manifest.web_snapshot_sha256,
  requirement_count: generation.concordance.length,
  answer_count: generation.answerLog.length,
  legacy_unmapped_answer_question_ids:
    generation.manifest.legacy_unmapped_answer_question_ids,
  document_status: generation.manifest.document_status,
  ready_for_compliance_review: generation.manifest.ready_for_compliance_review,
  ready_for_submission: false,
  docx_validation_status: docxValidation.status,
};
console.log(JSON.stringify(result, null, 2));

async function runPython(script, scriptArgs) {
  return execFileAsync("python3", [script, ...scriptArgs], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) continue;
    const key = argument.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Argument manquant: --${key}`);
    values[key] = value;
    index += 1;
  }
  if (!values.snapshot) throw new Error("Argument obligatoire manquant: --snapshot");
  if (!values.output) throw new Error("Argument obligatoire manquant: --output");
  return {
    snapshot: values.snapshot,
    output: values.output,
    generatedAt: values["generated-at"],
  };
}

function parseLastJsonObject(output) {
  const trimmed = output.trim();
  const start = trimmed.lastIndexOf("\n{");
  const candidate = start >= 0 ? trimmed.slice(start + 1) : trimmed;
  return JSON.parse(candidate);
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
