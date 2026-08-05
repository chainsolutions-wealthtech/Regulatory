import "server-only";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getQuestionsByGroup, validateProject } from "@/domain/questionnaire";
import type { ProspectusProject } from "@/domain/types";

export type ProspectusPreviewSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export async function buildProspectusPreview(project: ProspectusProject): Promise<{
  title: string;
  sections: ProspectusPreviewSection[];
  generatedAt: string;
  generationId: string;
  readyForComplianceReview: boolean;
  readyForSubmission: false;
}> {
  if (project.id === "united-capital-diamond") {
    const existing = await readExistingMarkdown().catch(() => null);
    if (existing) return existing;
  }

  const sections = getQuestionsByGroup(project)
    .map((group) => ({
      id: group.id,
      title: group.title,
      paragraphs: group.questions
        .map((question) => {
          const value = project.answers[question.id]?.value;
          if (value === undefined || value === null || value === "") return null;
          const rendered = Array.isArray(value) ? value.join(", ") : String(value);
          return `${question.label} : ${rendered}`;
        })
        .filter((value): value is string => Boolean(value)),
    }))
    .filter((section) => section.paragraphs.length > 0);

  const findings = validateProject(project);
  const generatedAt = new Date().toISOString();
  const generationId = `WEB-${digest(JSON.stringify({ project, sections })).slice(0, 16).toUpperCase()}`;
  return {
    title: project.fund.legalName || project.name,
    sections,
    generatedAt,
    generationId,
    readyForComplianceReview: findings.length === 0,
    readyForSubmission: false,
  };
}

async function readExistingMarkdown(): Promise<{
  title: string;
  sections: ProspectusPreviewSection[];
  generatedAt: string;
  generationId: string;
  readyForComplianceReview: boolean;
  readyForSubmission: false;
}> {
  const repoRoot = path.resolve(process.cwd(), "../..");
  const markdownPath = path.join(
    repoRoot,
    "examples",
    "generated",
    "united-capital-diamond",
    "prospectus-draft.md",
  );
  const manifestPath = path.join(
    repoRoot,
    "examples",
    "generated",
    "united-capital-diamond",
    "generation-manifest.json",
  );
  const [markdown, manifestRaw] = await Promise.all([
    readFile(markdownPath, "utf8"),
    readFile(manifestPath, "utf8"),
  ]);
  const manifest = JSON.parse(manifestRaw) as Record<string, unknown>;
  const sections = markdown
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
    title: markdown.match(/^# (.+)$/m)?.[1] ?? "United Capital Diamond",
    sections,
    generatedAt: String(manifest.generated_at ?? "2026-08-05T00:00:00.000Z"),
    generationId: String(manifest.generation_id ?? "GEN-UNKNOWN"),
    readyForComplianceReview: Boolean(manifest.ready_for_compliance_review),
    readyForSubmission: false,
  };
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
