import Link from "next/link";
import { Icon } from "@/components/atoms/Icon";

const items = [
  { segment: "", label: "Vue d’ensemble", icon: "dashboard" as const },
  { segment: "/questionnaire", label: "Questionnaire", icon: "document" as const },
  { segment: "/controls", label: "Contrôles", icon: "shield" as const },
  { segment: "/preview", label: "Aperçu", icon: "folder" as const },
];

export function ProjectWorkspaceNav({ projectId, active }: { projectId: string; active: "overview" | "questionnaire" | "controls" | "preview" }) {
  return (
    <nav className="workspace-nav" aria-label="Navigation du projet">
      {items.map((item) => {
        const key = item.segment === "" ? "overview" : item.segment.slice(1);
        return (
          <Link className={`workspace-nav__item${key === active ? " workspace-nav__item--active" : ""}`} href={`/projects/${projectId}${item.segment}`} key={item.segment}>
            <Icon name={item.icon} size={17} /><span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
