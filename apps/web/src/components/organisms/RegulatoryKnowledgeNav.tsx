import Link from "next/link";

export type RegulatoryKnowledgeSection =
  | "overview"
  | "sources"
  | "requirements"
  | "dependencies"
  | "clauses";

const items: Array<{ key: RegulatoryKnowledgeSection; href: string; label: string }> = [
  { key: "overview", href: "/regulatory-library", label: "Vue d’ensemble" },
  { key: "sources", href: "/regulatory-library/sources", label: "Sources" },
  { key: "requirements", href: "/regulatory-library/requirements", label: "Exigences" },
  { key: "dependencies", href: "/regulatory-library/dependencies", label: "Dépendances" },
  { key: "clauses", href: "/regulatory-library/clause-proposals", label: "Clauses" },
];

export function RegulatoryKnowledgeNav({ active }: { active: RegulatoryKnowledgeSection }) {
  return (
    <nav className="workspace-nav" aria-label="Navigation de la connaissance réglementaire">
      {items.map((item) => (
        <Link
          className={`workspace-nav__item${active === item.key ? " workspace-nav__item--active" : ""}`}
          href={item.href}
          key={item.key}
        >
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
