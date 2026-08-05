import Link from "next/link";
import { Icon } from "@/components/atoms/Icon";
import type { QuestionGroup } from "@/domain/types";

export function WizardStepper({ projectId, groups, activeGroupId, completedGroupIds }: { projectId: string; groups: QuestionGroup[]; activeGroupId: string; completedGroupIds: Set<string> }) {
  return (
    <nav className="wizard-stepper" aria-label="Étapes du questionnaire">
      {groups.map((group) => {
        const active = group.id === activeGroupId;
        const complete = completedGroupIds.has(group.id);
        return (
          <Link className={`wizard-step${active ? " wizard-step--active" : ""}${complete ? " wizard-step--complete" : ""}`} href={`/projects/${projectId}/questionnaire?group=${group.id}`} key={group.id}>
            <span className="wizard-step__index">{complete ? <Icon name="check" size={15} /> : group.sequence}</span>
            <span><strong>{group.title}</strong><small>{group.description}</small></span>
          </Link>
        );
      })}
    </nav>
  );
}
