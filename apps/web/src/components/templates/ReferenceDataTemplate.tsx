import { Badge } from "@/components/atoms/Badge";
import { StatCard } from "@/components/molecules/StatCard";
import { AppHeader } from "@/components/organisms/AppHeader";
import { AppShell } from "@/components/organisms/AppShell";
import {
  UMOA_MEMBER_STATE_BASELINE,
  XOF_APPLICATION_BASELINE,
  UNAVAILABLE_DYNAMIC_REFERENCE_FAMILIES,
} from "@/domain/reference-data";

export function ReferenceDataTemplate() {
  return (
    <AppShell active="reference-data">
      <AppHeader
        title="Référentiels"
        description="Exploration en lecture seule de la base applicative statique. Les données affichées ne constituent pas un registre dynamique d’acteurs agréés ni une attestation réglementaire."
      />
      <div className="page-stack">
        <section className="stat-grid" aria-label="État des référentiels">
          <StatCard label="États membres" value={UMOA_MEMBER_STATE_BASELINE.length} detail="Base statique UMOA" tone="info" />
          <StatCard label="Devise XOF" value={XOF_APPLICATION_BASELINE.length} detail="Option applicative existante" tone="info" />
          <StatCard label="Référentiels dynamiques" value={0} detail="Non matérialisés dans cette vue" tone="warning" />
          <StatCard label="Actions de validation" value={0} detail="Lecture seule" tone="success" />
        </section>
        <section className="content-section" aria-labelledby="reference-states-heading">
          <div className="section-heading">
            <div>
              <h2 id="reference-states-heading">États membres — base statique</h2>
              <p>Projection exacte de la liste déjà présente dans le domaine de l’application, sans nouvel enregistrement métier.</p>
            </div>
            <Badge tone="info">Base versionnée</Badge>
          </div>
          <div className="coverage-table">
            {UMOA_MEMBER_STATE_BASELINE.map((state) => (
              <div className="coverage-table__row" key={state.code}>
                <div>
                  <strong>{state.label}</strong>
                  <div><small>Code : {state.code} · Source : {state.provenance}</small></div>
                </div>
                <Badge tone="neutral">Statique</Badge>
              </div>
            ))}
          </div>
        </section>
        <section className="content-section" aria-labelledby="reference-currency-heading">
          <div className="section-heading">
            <div>
              <h2 id="reference-currency-heading">Devise XOF — base applicative</h2>
              <p>Réutilise l’option du questionnaire existant. Ce référencement ne constitue ni un cours de change ni une confirmation institutionnelle en temps réel.</p>
            </div>
          </div>
          <div className="coverage-table">
            {XOF_APPLICATION_BASELINE.length > 0 ? XOF_APPLICATION_BASELINE.map((currency) => (
              <div className="coverage-table__row" key={currency.code}>
                <div>
                  <strong>{currency.label}</strong>
                  <div><small>Code : {currency.code} · Source : {currency.provenance}</small></div>
                </div>
                <Badge tone="neutral">Statique</Badge>
              </div>
            )) : (
              <div className="empty-state">
                <h3>Devise non disponible</h3>
                <p>Aucune option XOF n’est matérialisée dans le questionnaire actuel. Aucune valeur suppléante n’est créée.</p>
              </div>
            )}
          </div>
        </section>
        <section className="content-section" aria-labelledby="reference-dynamic-heading">
          <div className="section-heading">
            <div>
              <h2 id="reference-dynamic-heading">Familles dynamiques — non matérialisées</h2>
              <p>Ces catégories ne possèdent ici ni registre officiel synchronisé, ni version attestée, ni autorisation de préremplissage automatique.</p>
            </div>
            <Badge tone="warning">Données externes à vérifier</Badge>
          </div>
          <div className="coverage-table">
            {UNAVAILABLE_DYNAMIC_REFERENCE_FAMILIES.map((family) => (
              <div className="coverage-table__row" key={family.id}>
                <div><strong>{family.label}</strong><div><small>Aucune liste d’acteurs ou de dates n’est affichée sans source versionnée et contrôlée.</small></div></div>
                <Badge tone="warning">Non matérialisé</Badge>
              </div>
            ))}
          </div>
        </section>
        <section className="content-section">
          <h2>Frontière de validation</h2>
          <p>La présente page est uniquement informative. Elle n’attribue aucun statut d’agrément aux organismes, ne modifie aucune donnée canonique et ne déclenche aucune soumission.</p>
          <p><strong>ready_for_submission=false</strong> demeure un invariant du produit.</p>
        </section>
      </div>
    </AppShell>
  );
}
