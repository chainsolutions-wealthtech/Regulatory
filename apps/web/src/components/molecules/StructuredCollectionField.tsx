"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Input, Select, Textarea } from "@/components/atoms/Field";
import styles from "@/components/molecules/StructuredCollectionField.module.css";
import { MEMBER_STATES } from "@/domain/constants";
import {
  createDefaultStructuredRow,
  normalizeStructuredQuestionValue,
  validateStructuredQuestionValue,
} from "@/domain/structured-answers";
import type {
  StructuredAnswerContext,
} from "@/domain/structured-answers";
import type {
  StructuredCollectionQuestionType,
  StructuredCollectionValue,
} from "@/domain/types";

type Row = Record<string, unknown>;
type FieldKind = "text" | "number" | "select" | "textarea" | "boolean" | "date";
type FieldDefinition = {
  key: string;
  label: string;
  kind: FieldKind;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  full?: boolean;
  placeholder?: string;
};

export function StructuredCollectionField({
  id,
  questionId,
  type,
  value,
  defaultCurrency,
  defaultCountryCode,
  disabled,
  onChange,
}: {
  id: string;
  questionId: string;
  type: Exclude<StructuredCollectionQuestionType, "SHARE_CLASS_COLLECTION">;
  value: unknown;
  defaultCurrency?: string;
  defaultCountryCode?: string;
  disabled?: boolean;
  onChange: (value: StructuredCollectionValue) => void;
}) {
  const context = useMemo<StructuredAnswerContext>(
    () => ({ currency: defaultCurrency, countryCode: defaultCountryCode }),
    [defaultCurrency, defaultCountryCode],
  );
  const normalizedIncoming = useMemo(
    () => normalizeRows(questionId, value, context),
    [questionId, value, context],
  );
  const [rows, setRows] = useState<Row[]>(normalizedIncoming);
  const [error, setError] = useState<string | null>(null);
  const definition = COLLECTION_DEFINITIONS[type];

  useEffect(() => {
    setRows(normalizedIncoming);
  }, [normalizedIncoming]);

  function updateRow(index: number, key: string, nextValue: unknown) {
    setRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: nextValue } : row)),
    );
    setError(null);
  }

  function addRow() {
    const created = createDefaultStructuredRow(type, rows.length, context) as Row;
    setRows((current) => [...current, created]);
    setError(null);
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
    setError(null);
  }

  function commit() {
    try {
      validateStructuredQuestionValue(questionId, rows);
      setError(null);
      onChange(rows as StructuredCollectionValue);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La collection est invalide.");
    }
  }

  return (
    <div className={styles.editor} id={id}>
      <div className={styles.intro}>
        <p>
          Chaque ligne alimente directement <code>{definition.canonicalPath}</code> et reste soumise
          à revue humaine.
        </p>
        <Button
          disabled={disabled || rows.length >= definition.maximumRows}
          onClick={addRow}
          size="sm"
          type="button"
          variant="secondary"
        >
          Ajouter {definition.addLabel}
        </Button>
      </div>

      <div className={styles.rows}>
        {rows.map((row, index) => (
          <section className={styles.row} key={rowKey(row, index)}>
            <div className={styles.rowHeader}>
              <h3>{definition.rowLabel} {index + 1}</h3>
              <Button
                disabled={disabled || rows.length === 1}
                onClick={() => removeRow(index)}
                size="sm"
                type="button"
                variant="danger"
              >
                Supprimer
              </Button>
            </div>
            <div className={styles.grid}>
              {definition.fields.map((field) => (
                <label className={field.full ? styles.full : undefined} key={field.key}>
                  <span>{field.label}</span>
                  {renderField({
                    field,
                    value: row[field.key],
                    disabled,
                    onChange: (nextValue) => updateRow(index, field.key, nextValue),
                  })}
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles.actions}>
        <span>
          {rows.length} ligne{rows.length > 1 ? "s" : ""} — statut initial : revue requise
        </span>
        <Button disabled={disabled} onClick={commit} type="button">
          Enregistrer la collection
        </Button>
      </div>
    </div>
  );
}

function normalizeRows(
  questionId: string,
  value: unknown,
  context: StructuredAnswerContext,
): Row[] {
  const normalized = normalizeStructuredQuestionValue(questionId, value, context);
  return Array.isArray(normalized) ? (normalized as Row[]) : [];
}

function renderField({
  field,
  value,
  disabled,
  onChange,
}: {
  field: FieldDefinition;
  value: unknown;
  disabled?: boolean;
  onChange: (value: unknown) => void;
}) {
  if (field.kind === "select" || field.kind === "boolean") {
    const options =
      field.kind === "boolean"
        ? [
            { value: "true", label: "Oui" },
            { value: "false", label: "Non" },
          ]
        : field.options ?? [];
    return (
      <Select
        disabled={disabled}
        value={field.kind === "boolean" ? String(Boolean(value)) : String(value ?? "")}
        onChange={(event) =>
          onChange(field.kind === "boolean" ? event.target.value === "true" : event.target.value)
        }
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    );
  }
  if (field.kind === "textarea") {
    return (
      <Textarea
        disabled={disabled}
        placeholder={field.placeholder}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }
  return (
    <Input
      disabled={disabled}
      min={field.min}
      max={field.max}
      step={field.step}
      placeholder={field.placeholder}
      type={field.kind === "number" ? "number" : field.kind === "date" ? "date" : "text"}
      value={value === undefined || value === null ? "" : String(value)}
      onChange={(event) =>
        onChange(field.kind === "number" ? Number(event.target.value) : event.target.value)
      }
    />
  );
}

function rowKey(row: Row, index: number): string {
  const candidate = Object.entries(row).find(([key]) => key.endsWith("_id"))?.[1];
  return String(candidate ?? `row-${index}`);
}

const ASSET_CLASSES = [
  "CASH",
  "MONEY_MARKET",
  "DEBT_AND_MONEY_MARKET",
  "GOVERNMENT_BONDS",
  "CORPORATE_BONDS",
  "EQUITIES",
  "FUNDS",
  "REAL_ESTATE",
  "DERIVATIVES",
  "OTHER",
].map((value) => ({ value, label: value.replaceAll("_", " ") }));

const COLLECTION_DEFINITIONS: Record<
  Exclude<StructuredCollectionQuestionType, "SHARE_CLASS_COLLECTION">,
  {
    canonicalPath: string;
    addLabel: string;
    rowLabel: string;
    maximumRows: number;
    fields: FieldDefinition[];
  }
> = {
  ASSET_RANGE_COLLECTION: {
    canonicalPath: "investment_policy.asset_class_ranges[]",
    addLabel: "une fourchette",
    rowLabel: "Fourchette",
    maximumRows: 30,
    fields: [
      { key: "range_id", label: "Identifiant stable", kind: "text" },
      { key: "asset_class", label: "Classe d’actifs", kind: "select", options: ASSET_CLASSES },
      { key: "minimum_percent", label: "Minimum (%)", kind: "number", min: 0, max: 100, step: 0.01 },
      { key: "target_percent", label: "Cible (%)", kind: "number", min: 0, max: 100, step: 0.01 },
      { key: "maximum_percent", label: "Maximum (%)", kind: "number", min: 0, max: 100, step: 0.01 },
    ],
  },
  FEE_COLLECTION: {
    canonicalPath: "fees / remunerations[]",
    addLabel: "une ligne de frais",
    rowLabel: "Frais ou rémunération",
    maximumRows: 50,
    fields: [
      { key: "fee_id", label: "Identifiant stable", kind: "text" },
      {
        key: "fee_type",
        label: "Type",
        kind: "select",
        options: ["SUBSCRIPTION", "REDEMPTION", "MANAGEMENT", "DEPOSITARY", "AUDIT", "DISTRIBUTION", "TRANSACTION", "OTHER"].map((value) => ({ value, label: value.replaceAll("_", " ") })),
      },
      { key: "label", label: "Libellé", kind: "text" },
      {
        key: "payer_type",
        label: "Payeur",
        kind: "select",
        options: [
          { value: "HOLDER", label: "Porteur" },
          { value: "FUND_ASSETS", label: "Actifs du fonds" },
        ],
      },
      { key: "beneficiary", label: "Bénéficiaire", kind: "text" },
      { key: "basis", label: "Assiette", kind: "text", full: true },
      {
        key: "rate_type",
        label: "Mode de tarification",
        kind: "select",
        options: ["PERCENTAGE", "PER_MILLE", "FIXED", "NONE", "OTHER"].map((value) => ({ value, label: value.replaceAll("_", " ") })),
      },
      { key: "rate_percent", label: "Taux (%)", kind: "number", min: 0, max: 100, step: 0.0001 },
      { key: "rate_per_mille", label: "Taux (‰)", kind: "number", min: 0, max: 1000, step: 0.0001 },
      { key: "amount", label: "Montant fixe", kind: "number", min: 0, step: 0.01 },
      { key: "currency", label: "Devise", kind: "text" },
      { key: "frequency", label: "Périodicité", kind: "text" },
      { key: "cap", label: "Plafond", kind: "text" },
      { key: "tax_display", label: "Fiscalité / taxes", kind: "text" },
    ],
  },
  VALUATION_METHOD_COLLECTION: {
    canonicalPath: "valuation.methods[]",
    addLabel: "une méthode",
    rowLabel: "Méthode",
    maximumRows: 30,
    fields: [
      { key: "method_id", label: "Identifiant stable", kind: "text" },
      { key: "asset_class", label: "Classe d’actifs", kind: "select", options: ASSET_CLASSES },
      { key: "primary_method", label: "Méthode principale", kind: "textarea", full: true },
      { key: "price_source", label: "Source de prix", kind: "textarea", full: true },
      { key: "fallback_method", label: "Méthode de secours", kind: "textarea", full: true },
      { key: "frequency", label: "Fréquence", kind: "text" },
      { key: "exception_process", label: "Processus d’exception", kind: "textarea", full: true },
    ],
  },
  PARTY_COLLECTION: {
    canonicalPath: "manager.governance_members[] / service_providers[]",
    addLabel: "un intervenant",
    rowLabel: "Intervenant",
    maximumRows: 50,
    fields: [
      { key: "party_id", label: "Identifiant stable", kind: "text" },
      {
        key: "role",
        label: "Rôle",
        kind: "select",
        options: ["MANAGEMENT_COMPANY", "GOVERNANCE_MEMBER", "DEPOSITARY", "AUDITOR", "ACCOUNTING_CONTROL", "EXTERNAL_ADVISER", "DISTRIBUTOR", "PAYING_AGENT", "OTHER"].map((value) => ({ value, label: value.replaceAll("_", " ") })),
      },
      { key: "legal_name", label: "Dénomination", kind: "text" },
      { key: "person_name", label: "Nom de la personne", kind: "text" },
      { key: "function_title", label: "Fonction", kind: "text" },
      { key: "legal_form", label: "Forme juridique", kind: "text" },
      { key: "approval_number", label: "Numéro d’agrément", kind: "text" },
      { key: "registered_office", label: "Siège", kind: "textarea", full: true },
      { key: "main_activity", label: "Activité principale", kind: "textarea", full: true },
      { key: "significant_external_activities", label: "Activités externes significatives", kind: "textarea", full: true },
      { key: "conflicts", label: "Conflits et mesures", kind: "textarea", full: true },
    ],
  },
  RISK_COLLECTION: {
    canonicalPath: "risks[]",
    addLabel: "un risque",
    rowLabel: "Risque",
    maximumRows: 50,
    fields: [
      { key: "risk_id", label: "Identifiant stable", kind: "text" },
      {
        key: "category",
        label: "Catégorie",
        kind: "select",
        options: ["CAPITAL_LOSS", "MARKET", "CREDIT", "INTEREST_RATE", "LIQUIDITY", "CURRENCY", "COUNTERPARTY", "OPERATIONAL", "CONCENTRATION", "VALUATION", "MANAGEMENT", "OTHER"].map((value) => ({ value, label: value.replaceAll("_", " ") })),
      },
      { key: "label", label: "Libellé", kind: "text" },
      { key: "description", label: "Description", kind: "textarea", full: true },
      {
        key: "source",
        label: "Origine",
        kind: "select",
        options: [
          { value: "DERIVED", label: "Dérivé par le moteur" },
          { value: "USER", label: "Saisi par l’utilisateur" },
          { value: "REGULATORY_REFERENCE", label: "Référentiel réglementaire" },
        ],
      },
    ],
  },
  COUNTRY_ARRANGEMENT_COLLECTION: {
    canonicalPath: "distribution_countries[]",
    addLabel: "un pays",
    rowLabel: "Dispositif pays",
    maximumRows: 8,
    fields: [
      { key: "arrangement_id", label: "Identifiant stable", kind: "text" },
      { key: "country_code", label: "État membre", kind: "select", options: [...MEMBER_STATES] },
      { key: "is_home_state", label: "État d’établissement", kind: "boolean" },
      { key: "marketing_authorization_reference", label: "Référence d’autorisation", kind: "text", full: true },
      { key: "paying_agents", label: "Agents payeurs", kind: "textarea", full: true },
      { key: "redemption_locations", label: "Lieux de rachat", kind: "textarea", full: true },
      { key: "information_locations", label: "Lieux d’information", kind: "textarea", full: true },
    ],
  },
  EVIDENCE_COLLECTION: {
    canonicalPath: "evidence[]",
    addLabel: "un justificatif",
    rowLabel: "Justificatif",
    maximumRows: 100,
    fields: [
      { key: "evidence_id", label: "Identifiant stable", kind: "text" },
      {
        key: "evidence_type",
        label: "Type de preuve",
        kind: "select",
        options: ["APPROVAL", "RCCM", "STATUTES", "FUND_REGULATION", "SERVICE_AGREEMENT", "POLICY", "OFFICIAL_REGISTER", "FINANCIAL_STATEMENT", "LEGAL_MEMO", "TAX_MEMO", "OTHER"].map((value) => ({ value, label: value.replaceAll("_", " ") })),
      },
      { key: "title", label: "Titre", kind: "text" },
      { key: "reference", label: "Référence", kind: "text" },
      { key: "issuer", label: "Émetteur", kind: "text" },
      { key: "issue_date", label: "Date", kind: "date" },
      { key: "file_reference", label: "Fichier ou URI", kind: "text", full: true },
      {
        key: "verification_status",
        label: "Vérification",
        kind: "select",
        options: [
          { value: "PENDING", label: "En attente" },
          { value: "VERIFIED", label: "Vérifié" },
          { value: "REJECTED", label: "Rejeté" },
        ],
      },
    ],
  },
};
