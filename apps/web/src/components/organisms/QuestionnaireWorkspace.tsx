"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { QuestionCard } from "@/components/molecules/QuestionCard";
import { WizardStepper } from "@/components/organisms/WizardStepper";
import type {
  ProspectusProject,
  QuestionGroupWithQuestions,
} from "@/domain/types";

export function QuestionnaireWorkspace({
  initialProject,
  initialGroups,
  activeGroupId,
}: {
  initialProject: ProspectusProject;
  initialGroups: QuestionGroupWithQuestions[];
  activeGroupId: string;
}) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [groups, setGroups] = useState(initialGroups);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending] = useTransition();
  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? groups[0];
  const completedGroupIds = useMemo(
    () =>
      new Set(
        groups
          .filter((group) =>
            group.questions.every(
              (question) => !question.required || hasAnswer(project.answers[question.id]?.value),
            ),
          )
          .map((group) => group.id),
      ),
    [groups, project.answers],
  );
  const progress = calculateProgress(groups, project);

  if (!activeGroup) {
    return <p className="form-error">Aucune question applicable n’a été générée.</p>;
  }

  async function save(questionId: string, value: unknown) {
    setSavingQuestionId(questionId);
    setError(null);
    const previousProject = project;
    const optimistic = {
      ...project,
      answers: {
        ...project.answers,
        [questionId]: {
          questionId,
          value,
          updatedAt: new Date().toISOString(),
          updatedBy: "local-prototype-user",
          source: "USER" as const,
          reviewStatus: "UNREVIEWED" as const,
        },
      },
    };
    setProject(optimistic);
    try {
      const response = await fetch(`/api/projects/${project.id}/answers`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId, value }),
      });
      const body = (await response.json()) as {
        error?: string;
        project?: ProspectusProject;
        groups?: QuestionGroupWithQuestions[];
      };
      if (!response.ok || !body.project || !body.groups) {
        throw new Error(body.error ?? "Échec de l’enregistrement");
      }
      setProject(body.project);
      setGroups(body.groups);
      router.refresh();
    } catch (caught) {
      setProject(previousProject);
      setError(caught instanceof Error ? caught.message : "Échec de l’enregistrement");
    } finally {
      setSavingQuestionId(null);
    }
  }

  const currentIndex = groups.findIndex((group) => group.id === activeGroup.id);
  const nextGroup = groups[currentIndex + 1];
  const previousGroup = groups[currentIndex - 1];

  return (
    <div className="wizard-layout">
      <WizardStepper
        projectId={project.id}
        groups={groups}
        activeGroupId={activeGroup.id}
        completedGroupIds={completedGroupIds}
      />
      <section className="wizard-content">
        <div className="wizard-content__header">
          <div>
            <div className="wizard-content__eyeline">
              <Badge tone={completedGroupIds.has(activeGroup.id) ? "success" : "info"}>
                Étape {activeGroup.sequence} sur {groups.length}
              </Badge>
              <span>{savingQuestionId ? "Enregistrement…" : "Sauvegarde automatique"}</span>
            </div>
            <h2>{activeGroup.title}</h2>
            <p>{activeGroup.description}</p>
          </div>
          <ProgressBar value={progress} label="Progression totale" />
        </div>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="question-stack">
          {activeGroup.questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              value={project.answers[question.id]?.value}
              defaultCurrency={project.fund.currency}
              disabled={pending}
              onChange={(value) => save(question.id, value)}
            />
          ))}
        </div>
        <div className="wizard-actions">
          {previousGroup ? (
            <Button
              href={`/projects/${project.id}/questionnaire?group=${previousGroup.id}`}
              variant="secondary"
            >
              Étape précédente
            </Button>
          ) : (
            <span />
          )}
          {nextGroup ? (
            <Button href={`/projects/${project.id}/questionnaire?group=${nextGroup.id}`} icon="arrow">
              Étape suivante
            </Button>
          ) : (
            <Button href={`/projects/${project.id}/controls`} icon="shield">
              Voir les contrôles
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

function calculateProgress(
  groups: QuestionGroupWithQuestions[],
  project: ProspectusProject,
): number {
  const required = groups.flatMap((group) => group.questions).filter((question) => question.required);
  if (required.length === 0) return 0;
  const completed = required.filter((question) => hasAnswer(project.answers[question.id]?.value)).length;
  return Math.round((completed / required.length) * 100);
}

function hasAnswer(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}