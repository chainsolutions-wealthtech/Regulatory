# ROADMAP — Chemin de clôture du projet

> **Statut :** `APPLICABLE`  
> **Date de référence :** 2026-08-08  
> **Plan maître :** `regulatory/plans/MASTER_COMPLETION_PLAN_8_STEPS.md`  
> **État produit :** `FUNCTIONAL_PRE_COMPLIANCE_PLATFORM_REGULATORY_REVIEW_IN_PROGRESS`  
> **ready_for_submission :** `false`

## Principe

Le projet a dépassé les anciens horizons « fondations → premier moteur testable » : le moteur, l'application Next.js, le questionnaire, le modèle canonique, la génération DOCX, le workflow de revue et la persistance PostgreSQL existent déjà.

La roadmap exécutable est désormais constituée des huit étapes de clôture suivantes. Une étape n'est terminée que lorsque les critères de sortie du plan maître sont satisfaits.

## Étape 1 — CI

Rétablir GitHub Actions, puis revalider la tête courante du dépôt avec Regulatory CI, Security and Review Policy CI et les validations réglementaires générées.

État : `BLOCKED_EXTERNAL_GITHUB_BILLING`.

## Étape 2 — Corpus réglementaire bloquant

Fermer les acquisitions documentaires restantes, avec priorité à la Décision sanctions `CM/10/06/2022`, à la Décision `2012-119`, au backfill des anciens textes Article 92 et aux sources frais/paiement déjà identifiées.

État : `IN_PROGRESS_WITH_EXTERNAL_DOCUMENT_BLOCKERS`.

## Étape 3 — Dépendances Instruction 66

Fermer les dépendances externes de l'Instruction 66 : 34 renvois circulaires, 7 renvois Instructions, 5 dépendances comptables et les autres liens explicitement identifiés.

État : `ADVANCED_NOT_CLOSED`.

## Étape 4 — Revue humaine réglementaire

Soumettre les exigences candidates, clauses, seuils, délais, exceptions, sanctions et éléments fiscaux aux rôles humains compétents. Conserver les décisions et preuves.

État : `BLOCKING_FOR_ACTIVATION`.

## Étape 5 — Activation contrôlée

Connecter au moteur uniquement les règles réellement approuvées, versionner les packs réglementaires et gérer dates d'effet, migrations et snapshots historiques.

État : `PARTIALLY_IMPLEMENTED_ACTIVATION_GATED`.

## Étape 6 — Industrialisation frontend/backend

Poursuivre `apps/web` sans le recommencer : PostgreSQL réel, OIDC réel, multi-tenant, stockage objet, antivirus, bibliothèque réglementaire, clauses, import, diff/versioning, observabilité et exploitation.

État : `FUNCTIONAL_FRONTEND_PRE_PRODUCTION`.

## Étape 7 — Livrables finaux

Finaliser DOCX de production, PDF déterministe, concordance, rapports, manifestes, preuves et dossier ZIP de revue/dépôt.

État : `DOCX_FUNCTIONAL_FINAL_PACKAGE_NOT_COMPLETE`.

## Étape 8 — Recette et production

Exécuter E2E navigateur, accessibilité, sécurité, performance, sauvegarde/restauration, recette métier/réglementaire et déploiement contrôlé.

État : `NOT_PRODUCTION_READY`.

## Extensions après clôture du socle

SICAV et autres véhicules, DICI généré depuis le même modèle canonique, import avancé, autres juridictions et nouveaux packs réglementaires restent des extensions versionnées. Elles ne doivent pas détourner la clôture des huit étapes du socle.

## Règle de soumission

Aucune étape de cette roadmap n'autorise implicitement une soumission réglementaire. `ready_for_submission` reste `false` jusqu'à une décision finale explicite, humaine et tracée après franchissement des gates applicables.
