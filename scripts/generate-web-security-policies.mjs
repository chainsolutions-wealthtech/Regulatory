import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(repositoryRoot, "apps/web/src/generated/security");
const sources = [
  {
    id: "rbac",
    input: "policies/rbac/PROSPECTUS_RBAC_V1.json",
    output: "PROSPECTUS_RBAC_V1.json",
  },
  {
    id: "workflow",
    input: "policies/workflow/PROSPECTUS_REVIEW_WORKFLOW_V1.json",
    output: "PROSPECTUS_REVIEW_WORKFLOW_V1.json",
  },
];

await mkdir(outputDirectory, { recursive: true });
const manifest = {
  schemaVersion: "WEB_SECURITY_POLICY_MANIFEST_V1",
  generatedFrom: {},
};

for (const source of sources) {
  const inputPath = path.join(repositoryRoot, source.input);
  const raw = await readFile(inputPath, "utf8");
  const parsed = JSON.parse(raw);
  const normalized = `${JSON.stringify(parsed, null, 2)}\n`;
  await writeFile(path.join(outputDirectory, source.output), normalized, "utf8");
  manifest.generatedFrom[source.id] = {
    path: source.input,
    schemaVersion: parsed.schemaVersion,
    sha256: createHash("sha256").update(raw).digest("hex"),
  };
}

await writeFile(
  path.join(outputDirectory, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(JSON.stringify({ outputDirectory, ...manifest }, null, 2));
