import { Badge } from "@/components/atoms/Badge";
import { AppHeader } from "@/components/organisms/AppHeader";
import { AppShell } from "@/components/organisms/AppShell";
import { StatCard } from "@/components/molecules/StatCard";
import { regulatoryStorageDriver } from "@/server/storage";

function isConfigured(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function ConfigurationRow({ label, configured, detail }: { label: string; configured: boolean; detail: string }) {
  return (
    <div className="coverage-table__row">
      <div>
        <strong>{label}</strong>
        <div><small>{detail}</small></div>
      </div>
      <Badge tone={configured ? "success" : "warning"}>{configured ? "Configuré" : "À configurer"}</Badge>
    </div>
  );
}

export function SettingsReadinessTemplate() {
  const databaseConfigured = isConfigured("DATABASE_URL");
  const artifactRootConfigured = isConfigured("REGULATORY_ARTIFACT_ROOT");
  const oidcIssuerConfigured = isConfigured("OIDC_ISSUER");
  const oidcAudienceConfigured = isConfigured("OIDC_AUDIENCE");
  const oidcJwksConfigured = isConfigured("OIDC_JWKS_URI");
  const oidcConfigured = oidcIssuerConfigured && oidcAudienceConfigured && oidcJwksConfigured;
  const runtimeConfigurationCount = [databaseConfigured, artifactRootConfigured, oidcConfigured].filter(Boolean).length;

  return (
    <AppShell active="settings">
      <AppHeader
        title="Paramètres et préparation opérationnelle"
        description="État non secret de la configuration runtime. Cette page n’affiche jamais les valeurs de connexion, jetons ou secrets."
      />
      <div className="page-stack">
        <section className="stat-grid">
          <StatCard label="Driver de stockage" value={regulatoryStorageDriver} detail={regulatoryStorageDriver === "postgresql" ? "Runtime serveur" : "Prototype local"} tone={regulatoryStorageDriver === "postgresql" ? "success" : "warning"} />
          <StatCard label="Configuration runtime" value={`${runtimeConfigurationCount}/3`} detail="DB · artefacts · OIDC" tone={runtimeConfigurationCount === 3 ? "success" : "warning"} />
          <StatCard label="Soumission" value="Fermée" detail="Invariant obligatoire" tone="danger" />
          <StatCard label="Production" value="Non prête" detail="Recette requise" tone="warning" />
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Configuration du runtime</h2>
              <p>Contrôle de présence uniquement. Les secrets restent côté serveur et ne sont jamais rendus dans l’interface.</p>
            </div>
            <Badge tone="info">{process.env.NODE_ENV ?? "development"}</Badge>
          </div>
          <div className="coverage-table">
            <ConfigurationRow label="PostgreSQL" configured={databaseConfigured} detail="DATABASE_URL" />
            <ConfigurationRow label="Stockage d’artefacts" configured={artifactRootConfigured} detail="REGULATORY_ARTIFACT_ROOT — stockage filesystem actuel" />
            <ConfigurationRow label="OIDC — issuer" configured={oidcIssuerConfigured} detail="OIDC_ISSUER" />
            <ConfigurationRow label="OIDC — audience" configured={oidcAudienceConfigured} detail="OIDC_AUDIENCE" />
            <ConfigurationRow label="OIDC — JWKS" configured={oidcJwksConfigured} detail="OIDC_JWKS_URI" />
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <h2>Gates de production</h2>
              <p>Ces gates restent fermés même si les variables runtime sont présentes. Ils exigent des preuves de recette et d’exploitation.</p>
            </div>
            <Badge tone="danger">ready_for_submission=false</Badge>
          </div>
          <div className="coverage-table">
            <ConfigurationRow label="PostgreSQL réellement activé" configured={regulatoryStorageDriver === "postgresql" && databaseConfigured} detail="Le driver doit être postgresql et la base configurée." />
            <ConfigurationRow label="Identité réelle" configured={regulatoryStorageDriver === "postgresql" && oidcConfigured} detail="OIDC doit être configuré et validé avec le fournisseur réel." />
            <ConfigurationRow label="Stockage objet de production" configured={false} detail="Le stockage filesystem actuel n’est pas le stockage objet final." />
            <ConfigurationRow label="Antivirus / quarantaine de production" configured={false} detail="Le service antivirus réel doit encore être branché et testé." />
            <ConfigurationRow label="Sauvegarde / restauration" configured={false} detail="Tests de sauvegarde, restauration et rétention encore requis." />
            <ConfigurationRow label="Recette E2E / sécurité / accessibilité" configured={false} detail="Gate final de l’étape 8 du plan maître." />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
