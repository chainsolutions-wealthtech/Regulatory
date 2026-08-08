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

Fonctions :

- statistiques du pack actif ;
- nombre d'exigences et questions ;
- groupes réglementaires ;
- exigences détaillées ;
- référence source ;
- statut de couverture ;
- statut de revue ;
- statut d'implémentation ;
- rôles de revue.

Garde-fous :

- lecture seule ;
- aucune approbation depuis cet écran ;
- aucune activation automatique ;
- aucune duplication des règles dans le frontend ;
- les statuts affichés ne valent pas validation juridique.

### Paramètres / préparation opérationnelle V1

Fichiers :

- `apps/web/src/components/templates/SettingsReadinessTemplate.tsx` ;
- `apps/web/src/app/settings/page.tsx`.

Fonctions :

- driver actif `local-json` / `postgresql` ;
- présence de `DATABASE_URL` sans affichage de sa valeur ;
- présence de `REGULATORY_ARTIFACT_ROOT` ;
- présence de la configuration OIDC (`OIDC_ISSUER`, `OIDC_AUDIENCE`, `OIDC_JWKS_URI`) ;
- état non secret des gates de production.

Garde-fous :

- aucun secret rendu au client ;
- stockage filesystem explicitement distingué du stockage objet de production ;
- antivirus, backup/restore et recette restent affichés comme non validés ;
- production et soumission restent fermées.

## Validation

Les changements sont implémentés sur `main` mais **ne doivent pas être déclarés CI-validés sur la tête courante** tant que `GITHUB_ACTIONS_BILLING_BLOCKER_2026_08_08` est actif.

Après rétablissement GitHub Actions :

1. `npm run web:typecheck` ;
2. `npm run web:build` ;
3. tests API HTTP ;
4. Regulatory CI ;
5. Security and Review Policy CI ;
6. inspection navigateur des pages `/regulatory-library` et `/settings`.

## Reste de l'étape 6

- bibliothèque des sources réglementaires et versions, au-delà du seul catalogue CIRC005 ;
- administration des clauses et versions ;
- vues de citations / preuves / analyses d'impact ;
- authentification OIDC réelle ;
- organisation / tenant réel ;
- activation PostgreSQL runtime ;
- stockage objet et antivirus réels ;
- import prospectus ;
- comparaison de versions ;
- observabilité ;
- UX/accessibilité responsive et navigateur ;
- configuration d'exploitation et secrets hors dépôt.
