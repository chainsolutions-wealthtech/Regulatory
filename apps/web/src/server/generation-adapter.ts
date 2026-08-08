import "server-only";

import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { CATALOG_METADATA } from "@/domain/regulatory-catalog";
import type { CanonicalSnapshot, ProspectusProject } from "@/domain/types";
import { buildCanonicalSnapshot } from "@/server/canonical-snapshot";

const execFileAsync = promisify(execFile);
const BASE_ARTIFACT_NAMES = [
  "canonical-snapshot.json",
  "prospectus-draft.md",
  "canonical-data.json",
  "questionnaire-state.json",
  "control-report.json",
  "concordance.json",
  "document-model.json",
  "answer-log.json",
  "generation-manifest.json",
  "prospectus-draft.docx",
  "docx-manifest.json",
  "docx-validation.json",
] as const;
const REVIEW_PACKAGE_ARTIFACT_NAMES = [
  "prospectus-draft.pdf",
  "pdf-manifest.json",
  "review-package-manifest.json",
  "review-package.zip",
] as const;
const GENERATED_ARTIFACT_NAMES = [
  ...BASE_ARTIFACT_NAMES,
  ...REVIEW_PACKAGE_ARTIFACT_NAMES,
] as const;

type BuildBundleOptions = {
  includeReviewPackage?: boolean;
};

export type ProspectusPreviewSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export type ProspectusPreview = {
  title: string;
  sections: ProspectusPreviewSection[];
  generatedAt: string;
  generationId: string;
  readyForComplianceReview: boolean;
  readyForSubmission: false;
  catalogDigest: string;
  requirementCount: number;
  canonicalSnapshot: CanonicalSnapshot;
};

export type GeneratedProspectusArtifact = {
  fileName: (typeof GENERATED_ARTIFACT_NAMES)[number];
  content: Buffer;
};

export type ProspectusGenerationBundle = {
  preview: ProspectusPreview;
  artifacts: GeneratedProspectusArtifact[];
};

export async function buildProspectusBundle(
  project: ProspectusProject,
  options: BuildBundleOptions = {},
): Promise<ProspectusGenerationBundle> {
  const includeReviewPackage = options.includeReviewPackage ?? true;
  const canonicalSnapshot = buildCanonicalSnapshot(project);
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "regulatory-web-generation-"));
  const snapshotPath = path.join(temporaryRoot, "canonical-snapshot.json");
  const outputDirectory = path.join(temporaryRoot, "output");
  const repoRoot = resolveRepositoryRoot();

  try {
    await writeFile(snapshotPath, `${JSON.stringify(canonicalSnapshot, null, 2)}\n`, "utf8");
    await execFileAsync(
      process.execPath,
      [
        path.join(repoRoot, "src", "cli", "generate-from-web-snapshot.js"),
        "--snapshot",
        snapshotPath,
        "--output",
        outputDirectory,
        "--generated-at",
        canonicalSnapshot.snapshotCreatedAt,
        "--review-package-mode",
        includeReviewPackage ? "enabled" : "disabled",
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024,
      },
    );

    const [markdown, manifestRaw] = await Promise.all([
      readFile(path.join(outputDirectory, "prospectus-draft.md"), "utf8"),
      readFile(path.join(outputDirectory, "generation-manifest.json"), "utf8"),
    ]);
    const artifactNames = includeReviewPackage
      ? GENERATED_ARTIFACT_NAMES
      : BASE_ARTIFACT_NAMES;
    const artifactContents = await Promise.all(
      artifactNames.map((fileName) => readFile(path.join(outputDirectory, fileName))),
    );
    const manifest = JSON.parse(manifestRaw) as Record<string, unknown>;
    const preview = previewFromMarkdown({ markdown, manifest, canonicalSnapshot });
    const artifacts: GeneratedProspectusArtifact[] = artifactNames.map(
      (fileName, index) => ({
        fileName,
        content: artifactContents[index],
      }),
    );
    return { preview, artifacts };
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

export async function buildProspectusPreview(project: ProspectusProject): Promise<ProspectusPreview> {
  return (await buildProspectusBundle(project, { includeReviewPackage: false })).preview;
}

function previewFromMarkdown(input: {
  markdown: string;
  manifest: Record<string, unknown>;
  canonicalSnapshot: CanonicalSnapshot;
}): ProspectusPreview {
  const sections = input.markdown
    .split(/^## /m)
    .slice(1)
    .map((chunk, index) => {
      const [heading, ...bodyLines] = chunk.split("\n");
      const paragraphs = bodyLines
        .join("\n")
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.replace(/^>\s?/, "").trim())
        .filter(Boolean);
      return { id: `section-${index + 1}`, title: heading.trim(), paragraphs };
    });

  return {
    title: input.markdown.match(/^# (.+)$/m)?.[1] ?? input.canonicalSnapshot.projectId,
    sections,
    generatedAt: String(input.manifest.generated_at ?? input.canonicalSnapshot.snapshotCreatedAt),
    generationId: String(input.manifest.generation_id ?? "GEN-UNKNOWN"),
    readyForComplianceReview: Boolean(input.manifest.ready_for_compliance_review),
    readyForSubmission: false,
    catalogDigest: CATALOG_METADATA.catalogDigest,
    requirementCount: CATALOG_METADATA.requirementCount,
    canonicalSnapshot: input.canonicalSnapshot,
  };
}

function resolveRepositoryRoot(): string {
  if (process.env.REGULATORY_REPOSITORY_ROOT) {
    return path.resolve(process.env.REGULATORY_REPOSITORY_ROOT);
  }
  return path.resolve(process.cwd(), "../..");
}
