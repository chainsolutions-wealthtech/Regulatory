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

/**
 * Preserve the public HTTP contract used by earlier questionnaire clients while
 * keeping the canonical structured-answer schema as the only persisted contract.
 *
 * This is deliberately a one-way compatibility adapter. It only aliases fields
 * whose semantics are equivalent. Fields with no exact canonical equivalent are
 * left untouched and are ignored/defaulted by the canonical normalizers rather
 * than being guessed into a different legal/business meaning.
 */
function upgradeLegacyStructuredAnswer(questionId: string, value: unknown): unknown {
  if (!Array.isArray(value)) return value;

  return value.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return entry;
    const record = entry as Record<string, unknown>;
    const upgraded: Record<string, unknown> = { ...record };

    if (questionId === "Q_SHARE_CLASSES_COUNT") {
      alias(upgraded, record, "class_id", "row_id");
      alias(upgraded, record, "income_policy", "distribution_policy");
      if (upgraded.initial_subscription_minimum === undefined && record.minimum_subscription !== undefined) {
        upgraded.initial_subscription_minimum = { display: String(record.minimum_subscription) };
      }
      return upgraded;
    }

    if (questionId === "Q_ASSET_EXPOSURE_MATRIX") {
      alias(upgraded, record, "range_id", "row_id");
      alias(upgraded, record, "minimum_percent", "min_pct");
      alias(upgraded, record, "target_percent", "target_pct");
      alias(upgraded, record, "maximum_percent", "max_pct");
      return upgraded;
    }

    if (questionId === "Q_TRANSACTION_FEES" || questionId === "Q_REMUNERATION_DETAILS") {
      alias(upgraded, record, "fee_id", "row_id");
      alias(upgraded, record, "payer_type", "charged_to");
      alias(upgraded, record, "basis", "calculation_basis");
      alias(upgraded, record, "rate_percent", "rate_pct");
      if (upgraded.rate_type === undefined && record.rate_pct !== undefined) {
        upgraded.rate_type = "PERCENTAGE";
      }
      return upgraded;
    }

    if (questionId === "Q_VALUATION_METHODS") {
      alias(upgraded, record, "method_id", "row_id");
      alias(upgraded, record, "primary_method", "method");
      alias(upgraded, record, "price_source", "source_reference");
      return upgraded;
    }

    if (questionId === "Q_CONFIRM_GOVERNANCE_MEMBERS") {
      alias(upgraded, record, "party_id", "row_id");
      alias(upgraded, record, "person_name", "name");
      // In the legacy governance payload `role` contained the person's function,
      // while the canonical party role is fixed to GOVERNANCE_MEMBER by the normalizer.
      if (upgraded.function_title === undefined && typeof record.role === "string") {
        upgraded.function_title = record.role;
      }
      return upgraded;
    }

    if (questionId === "APP_SERVICE_PROVIDERS") {
      alias(upgraded, record, "party_id", "row_id");
      alias(upgraded, record, "role", "party_type");
      alias(upgraded, record, "legal_name", "name");
      return upgraded;
    }

    if (questionId === "APP_RISK_FACTORS") {
      alias(upgraded, record, "risk_id", "row_id");
      alias(upgraded, record, "category", "risk_type");
      return upgraded;
    }

    if (questionId === "Q_HOME_STATE_ARRANGEMENTS") {
      alias(upgraded, record, "arrangement_id", "row_id");
      return upgraded;
    }

    if (questionId === "APP_EVIDENCE_COLLECTION") {
      alias(upgraded, record, "evidence_id", "row_id");
      alias(upgraded, record, "issue_date", "source_date");
      // Legacy status AVAILABLE has no exact canonical verification-status meaning;
      // leave it unmapped so the canonical normalizer safely defaults to PENDING.
      return upgraded;
    }

    return upgraded;
  });
}

function alias(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  canonicalKey: string,
  legacyKey: string,
): void {
  if (target[canonicalKey] === undefined && source[legacyKey] !== undefined) {
    target[canonicalKey] = source[legacyKey];
  }
}

function parseOptionalVersion(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}
