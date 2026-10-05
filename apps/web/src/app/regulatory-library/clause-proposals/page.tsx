import { AppHeader } from "@/components/organisms/AppHeader";
import { AppShell } from "@/components/organisms/AppShell";
import { ClauseProposalAdminPanel } from "@/components/organisms/ClauseProposalAdminPanel";
import { RegulatoryKnowledgeNav } from "@/components/organisms/RegulatoryKnowledgeNav";

export const dynamic = "force-dynamic";

export default function ClauseProposalsPage() {
  return (
    <AppShell active="library-admin">
      <AppHeader
        title="Clause Studio"
        description="Versioning juridique tenant-scoped, comparaison source/proposition, historique append-only et approbation humaine, sans activation automatique du catalogue global."
      />
      <RegulatoryKnowledgeNav active="clauses" />
      <ClauseProposalAdminPanel />
    </AppShell>
  );
}
