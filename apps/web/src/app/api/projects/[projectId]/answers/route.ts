import { NextResponse } from "next/server";
import { getQuestionById } from "@/domain/regulatory-catalog";
import { normalizeQuestionValueForPersistence } from "@/domain/structured-answers";
import { getQuestionsByGroup } from "@/domain/questionnaire";
import { projectRepository } from "@/server/storage";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const [{ projectId }, body] = await Promise.all([
    params,
    request.json().catch(() => null) as Promise<Record<string, unknown> | null>,
  ]);
  if (!body || typeof body.questionId !== "string") {
    return NextResponse.json({ error: "questionId est obligatoire." }, { status: 422 });
  }
  const question = getQuestionById(body.questionId);
  if (!question || question.interactive === false) {
    return NextResponse.json({ error: "Question inconnue ou non interactive." }, { status: 422 });
  }
  const expectedVersion = parseOptionalVersion(body.expectedVersion);
  if (body.expectedVersion !== undefined && expectedVersion === undefined) {
    return NextResponse.json({ error: "expectedVersion doit être un entier positif." }, { status: 422 });
  }
  try {
    const existingProject = await projectRepository.getProject(projectId);
    if (!existingProject) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }
    const upgradedValue = upgradeLegacyStructuredAnswer(body.questionId, body.value);
    const normalizedValue = normalizeQuestionValueForPersistence(body.questionId, upgradedValue, {
      currency: existingProject.fund.currency,
      countryCode: existingProject.fund.countryCode,
    });
    const project = await projectRepository.saveAnswer({
      projectId,
      questionId: body.questionId,
      value: normalizedValue,
      expectedVersion,
    });
    return NextResponse.json({ project, groups: getQuestionsByGroup(project) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur d’enregistrement.";
    const status = message.startsWith("PROJECT_VERSION_CONFLICT") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

function upgradeLegacyStructuredAnswer(questionId: string, value: unknown): unknown {
  if (questionId !== "Q_SHARE_CLASSES_COUNT" || !Array.isArray(value)) return value;
  return value.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return entry;
    const record = entry as Record<string, unknown>;
    const upgraded = { ...record };
    if (upgraded.class_id === undefined && typeof record.row_id === "string") {
      upgraded.class_id = record.row_id;
    }
    if (upgraded.income_policy === undefined && typeof record.distribution_policy === "string") {
      upgraded.income_policy = record.distribution_policy;
    }
    if (upgraded.initial_subscription_minimum === undefined && record.minimum_subscription !== undefined) {
      upgraded.initial_subscription_minimum = {
        display: String(record.minimum_subscription),
      };
    }
    return upgraded;
  });
}

function parseOptionalVersion(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}
