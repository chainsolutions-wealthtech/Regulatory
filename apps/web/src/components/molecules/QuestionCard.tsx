"use client";

import { FieldShell, Input, Select, Textarea } from "@/components/atoms/Field";
import type { ProspectusQuestion } from "@/domain/types";

export function QuestionCard({
  question,
  value,
  disabled,
  onChange,
}: {
  question: ProspectusQuestion;
  value: unknown;
  disabled?: boolean;
  onChange: (value: unknown) => void;
}) {
  const id = `question-${question.id}`;
  const sourceLabel =
    question.sourceKind === "REGULATORY_MATRIX"
      ? question.requirementIds.join(" · ")
      : question.sourceKind === "PENDING_REGULATORY_MAPPING"
        ? "Mapping réglementaire en attente"
        : "Question applicative";

  return (
    <article className="question-card">
      <div className="question-card__meta">
        <span>{sourceLabel}</span>
        <span>{question.reviewRoles.join(" / ")}</span>
      </div>
      <FieldShell
        id={id}
        label={question.label}
        help={question.helpText}
        required={question.required}
      >
        {renderControl(question, id, value, disabled, onChange)}
      </FieldShell>
      {question.uiFallback ? (
        <p className="question-card__example">
          Saisie provisoire : ce champ sera remplacé par un composant structuré dédié sans modifier
          l’identifiant canonique.
        </p>
      ) : null}
      {question.sourceReference ? (
        <p className="question-card__example">Référence : {question.sourceReference}</p>
      ) : null}
      {question.example ? <p className="question-card__example">Exemple : {question.example}</p> : null}
    </article>
  );
}

function renderControl(
  question: ProspectusQuestion,
  id: string,
  value: unknown,
  disabled: boolean | undefined,
  onChange: (value: unknown) => void,
) {
  const stringValue = formatInputValue(value);
  if (question.type === "TEXTAREA") {
    return (
      <Textarea
        id={id}
        disabled={disabled}
        value={stringValue}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }
  if (["SELECT", "COUNTRY"].includes(question.type)) {
    return (
      <Select
        id={id}
        disabled={disabled}
        value={stringValue}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Sélectionner</option>
        {question.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    );
  }
  if (question.type === "BOOLEAN") {
    return (
      <div className="choice-row" role="radiogroup" aria-label={question.label}>
        {question.options?.map((option) => (
          <label
            className={`choice-card${String(value) === option.value ? " choice-card--selected" : ""}`}
            key={option.value}
          >
            <input
              checked={String(value) === option.value}
              disabled={disabled}
              name={id}
              type="radio"
              value={option.value}
              onChange={(event) => onChange(event.target.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }
  if (question.type === "MULTISELECT") {
    const selected = Array.isArray(value) ? value.map(String) : [];
    return (
      <div className="choice-row choice-row--wrap">
        {question.options?.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <label
              className={`choice-card${checked ? " choice-card--selected" : ""}`}
              key={option.value}
            >
              <input
                checked={checked}
                disabled={disabled}
                type="checkbox"
                value={option.value}
                onChange={() =>
                  onChange(
                    checked
                      ? selected.filter((item) => item !== option.value)
                      : [...selected, option.value],
                  )
                }
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    );
  }
  if (question.type === "FILE") {
    return (
      <Input
        id={id}
        disabled={disabled}
        type="text"
        placeholder="Référence ou chemin du justificatif"
        value={stringValue}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }
  const inputType =
    question.type === "DATE"
      ? "date"
      : question.type === "TIME"
        ? "time"
        : ["PERCENTAGE", "AMOUNT"].includes(question.type)
          ? "number"
          : "text";
  return (
    <Input
      id={id}
      disabled={disabled}
      min={inputType === "number" ? 0 : undefined}
      max={question.type === "PERCENTAGE" ? 100 : undefined}
      step={inputType === "number" ? "0.01" : undefined}
      type={inputType}
      value={stringValue}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function formatInputValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}
