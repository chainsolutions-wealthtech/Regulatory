# Étape 6 — Industrialisation frontend/backend — progression 2026-08-08

> Plan maître : `regulatory/plans/MASTER_COMPLETION_PLAN_8_STEPS.md`  
> État : `IN_PROGRESS_CI_REVALIDATION_BLOCKED_EXTERNALLY`  
> `ready_for_submission=false`

## Principe

Le frontend existant sous `apps/web` est conservé et enrichi. Aucun second frontend, aucun second moteur réglementaire et aucune seconde source de vérité ne doivent être créés.

## Tranches réalisées aujourd'hui

### Bibliothèque réglementaire V1 — lecture seule

Fichiers :

- `apps/web/src/components/templates/RegulatoryLibraryTemplate.tsx` ;
- `apps/web/src/app/regulatory-library/page.tsx`.

La page utilise directement :

- `CATALOG_METADATA` ;
- `QUESTION_GROUPS` ;
- `REGULATORY_REQUIREMENTS` ;
- le catalogue généré déjà consommé par le questionnaire et le moteur documentaire.

Fonctions : statistiques du pack, groupes, exigences, références source, couverture, revue, implémentation et rôles de revue.

Garde-fous : lecture seule, aucune approbation, aucune activation automatique, aucune duplication des règles.

### Catalogue de clauses dérivé du compositeur

Source canonique : `src/catalog/clause-catalog.js`.

Ajouts :

- `scripts/generate-web-clause-catalog.mjs` ;
- `apps/web/src/domain/clause-catalog.ts` ;
- `apps/web/src/app/api/regulatory/clauses/route.ts` ;
- génération ajoutée à `predev`, `pretypecheck` et `prebuild`.

La bibliothèque réglementaire affiche désormais les clauses réellement utilisées par le compositeur : identifiant, version, catégorie, section, wording, exigences, champs et statut.

Invariants du générateur :

- identifiants uniques ;
- chaque clause liée à au moins une exigence et un champ ;
- toutes les clauses restent `DRAFT_LEGAL_REVIEW_REQUIRED` ;
- `automaticActivationAllowed=false` ;
- digest déterministe du catalogue.

### Paramètres / préparation opérationnelle V1

Fichiers :

- `apps/web/src/components/templates/SettingsReadinessTemplate.tsx` ;
- `apps/web/src/app/settings/page.tsx`.

Fonctions : driver actif, présence non secrète de la configuration DB/artefacts/OIDC, état des gates production.

Garde-fous : aucune valeur secrète rendue, stockage filesystem distingué du stockage objet final, antivirus/backup/recette non simulés, soumission fermée.

### Lecture sécurisée des artefacts générés

Architecture ajoutée :

- `apps/web/src/server/storage/generation-artifact-types.ts` ;
- `apps/web/src/server/storage/generation-artifact-repository.ts` ;
- `ArtifactStore.read(storageReference)` avec confinement filesystem ;
- wiring dans `apps/web/src/server/storage/index.ts` ;
- API de listing : `/api/projects/[projectId]/artifacts/[generationId]` ;
- API de téléchargement : `/api/projects/[projectId]/artifacts/[generationId]/[fileName]` ;
- panneau `GenerationArtifactsPanel` dans l'aperçu projet.

PostgreSQL :

- identité OIDC vérifiée ;
- membership organisation ;
- transaction avec contexte tenant/RLS ;
- résolution du document uniquement par projet + génération + nom serveur ;
- aucune `storage_reference` fournie par l'utilisateur ;
- SHA-256 et taille recalculés après lecture ;
- altération physique => `GENERATED_ARTIFACT_INTEGRITY_MISMATCH`.

Test PostgreSQL enrichi avec isolation tenant, lecture et corruption volontaire.

### Distinction aperçu / génération persistée

La page `/projects/[projectId]/preview` distingue désormais :

- aperçu courant reconstruit depuis le snapshot ;
- dernière génération réellement persistée ;
- téléchargements uniquement depuis les artefacts persistés.

Une simple consultation de l'aperçu ne génère pas le package PDF/ZIP.

## Validation

Les changements sont implémentés sur `main` mais **ne doivent pas être déclarés CI-validés sur la tête courante** tant que `GITHUB_ACTIONS_BILLING_BLOCKER_2026_08_08` est actif.

Après rétablissement GitHub Actions :

1. génération du catalogue de clauses et validation ;
2. `npm run web:typecheck` ;
3. `npm run web:build` ;
4. tests PostgreSQL, y compris isolation/lecture/intégrité des artefacts ;
5. tests API HTTP ;
6. Regulatory CI ;
7. Security and Review Policy CI ;
8. inspection navigateur `/regulatory-library`, `/settings`, `/projects/.../preview`.

## Reste de l'étape 6

- bibliothèque complète des sources réglementaires/versions/citations au-delà des catalogues actuellement projetés ;
- workflow d'administration/approbation des clauses après l'étape 4, sans bypass de revue ;
- vues de preuves / analyses d'impact ;
- authentification OIDC réelle ;
- organisation / tenant réel ;
- activation PostgreSQL runtime ;
- stockage objet et antivirus réels ;
- import prospectus ;
- comparaison de versions ;
- observabilité ;
- UX/accessibilité responsive et navigateur ;
- configuration d'exploitation et secrets hors dépôt.
