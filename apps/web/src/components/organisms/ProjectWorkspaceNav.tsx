import Link from "next/link";
import { Icon } from "@/components/atoms/Icon";

export type ProjectWorkspaceSection =
  | "overview"
  | "questionnaire"
  | "controls"
  | "preview"
  | "reviews"
  | "versions";

const items: Array<{
  segment: string;
  key: ProjectWorkspaceSection;
  label: string;
  icon: "dashboard" | "document" | "shield" | "folder";
}> = [
  { segment: "", key: "overview", label: "Vue d’ensemble", icon: "dashboard" },
  { segment: "/questionnaire", key: "questionnaire", label: "Questionnaire", icon: "document" },
  { segment: "/controls", key: "controls", label: "Contrôles", icon: "shield" },
  { segment: "/preview", key: "preview", label: "Aperçu", icon: "folder" },
  { segment: "/reviews", key: "reviews", label: "Revues", icon: "shield" },
  { segment: "/versions", key: "versions", label: "Versions", icon: "document" },
];

export function ProjectWorkspaceNav({
  projectId,
  active,
}: {
  projectId: string;
  active: ProjectWorkspaceSection;
}) {
  return (
    <nav className="workspace-nav" aria-label="Navigation du projet">
      {items.map((item) => (
        <Link
          className={`workspace-nav__item${item.key === active ? " workspace-nav__item--active" : ""}`}
          href={`/projects/${projectId}${item.segment}`}
          key={item.key}
        >
          <Icon name={item.icon} size={17} />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
