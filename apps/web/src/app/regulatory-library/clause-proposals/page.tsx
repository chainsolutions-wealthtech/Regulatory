import { AppHeader } from "@/components/organisms/AppHeader";
import { AppShell } from "@/components/organisms/AppShell";
import { ClauseProposalAdminPanel } from "@/components/organisms/ClauseProposalAdminPanel";

export const dynamic = "force-dynamic";

export default function ClauseProposalsPage() {
  return (
    <AppShell active="library-admin">
      <AppHeader
        title="Administration des propositions de clauses"
        description="Préparation juridique tenant-scoped avec historique append-only, séparation des rôles et aucune activation automatique du catalogue global."
      />
      <ClauseProposalAdminPanel />
    </AppShell>
  );
}
