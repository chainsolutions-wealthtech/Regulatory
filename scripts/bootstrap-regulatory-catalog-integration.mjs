import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  readdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const EXPECTED_CHUNK_COUNT = 10;
const EXPECTED_BASE64_LENGTH = 43_004;
const EXPECTED_ARCHIVE_SHA256 =
  "f21ef92d245414f230cb7b4c97cc56a2940af93ff54aaa6c7fc350b9d9c8ba04";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const chunksDir = path.join(repoRoot, "scripts", "bootstrap-chunks");
const legacyPartsDir = path.join(repoRoot, "scripts", "bootstrap-parts");
const archivePath = path.join(repoRoot, ".regulatory-catalog-integration.tar.gz");

const chunkNames = readdirSync(chunksDir)
  .filter((name) => /^chunk-\d+\.b64$/.test(name))
  .sort();

if (chunkNames.length !== EXPECTED_CHUNK_COUNT) {
  throw new Error(
    `Invalid bootstrap chunk count: expected ${EXPECTED_CHUNK_COUNT}, got ${chunkNames.length}`,
  );
}

const payload = chunkNames
  .map((name) => readFileSync(path.join(chunksDir, name), "utf8").trim())
  .join("");

if (payload.length !== EXPECTED_BASE64_LENGTH) {
  throw new Error(
    `Invalid bootstrap payload length: expected ${EXPECTED_BASE64_LENGTH}, got ${payload.length}`,
  );
}

const archive = Buffer.from(payload, "base64");
const digest = createHash("sha256").update(archive).digest("hex");

if (digest !== EXPECTED_ARCHIVE_SHA256) {
  throw new Error(
    `Invalid bootstrap archive digest: expected ${EXPECTED_ARCHIVE_SHA256}, got ${digest}`,
  );
}

writeFileSync(archivePath, archive);
execFileSync("tar", ["-xzf", archivePath, "-C", repoRoot], {
  stdio: "inherit",
});

unlinkSync(archivePath);
rmSync(chunksDir, { recursive: true, force: true });
rmSync(legacyPartsDir, { recursive: true, force: true });
unlinkSync(scriptPath);

console.log(
  JSON.stringify(
    {
      status: "SOURCE_SET_APPLIED",
      chunks: chunkNames.length,
      base64Length: payload.length,
      archiveSha256: digest,
    },
    null,
    2,
  ),
);
