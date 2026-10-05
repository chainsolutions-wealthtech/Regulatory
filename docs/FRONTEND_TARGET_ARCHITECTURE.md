# FRONTEND_TARGET_ARCHITECTURE — Regulatory

> **Statut :** `TARGET_ARCHITECTURE / IMPLEMENTATION_PROGRESSIVE`  
> **Dépôt :** `chainsolutions-wealthtech/Regulatory`  
> **Branche canonique :** `main`  
> **Principe :** étendre le frontend existant sans second modèle métier, sans duplication des règles et sans régression des contrats déjà testés.

## 1. Finalité

Le frontend cible transforme Regulatory en poste de travail complet pour une société de gestion, ses fonctions de contrôle et ses administrateurs.

Il réunit quatre surfaces coordonnées :

1. **Prospectus Composer** — constitution et mise à jour des dossiers ;
2. **Regulatory Knowledge** — sources, exigences, dépendances, clauses et impacts ;
3. **Review & Evidence** — preuves, contrôles, revues, décisions et audit ;
4. **Operations & Administration** — identité, sécurité, readiness, référentiels et exploitation.

Le frontend n'est jamais la source normative. Il projette les contrats du domaine, des registres et du runtime.

## 2. Principes

- conserver Next.js App Router + React + TypeScript ;
- conserver Atomic Design ;
- privilégier les Server Components pour la lecture ;
- limiter les Client Components aux interactions utiles ;
- réutiliser les types, catalogues et repositories existants ;
- ne jamais coder une règle réglementaire dans une vue ;
- distinguer `IMPLEMENTED`, `TESTED`, `CONFIGURED`, `ACTIVATED`, `DEPLOYED` et `PRODUCTION_VERIFIED` ;
- conserver `ready_for_submission=false` tant que les gates ne sont pas satisfaits ;
- ne jamais exposer une soumission sans capacité serveur et validations explicitement autorisées ;
- rendre visibles provenance, version et rôles de revue.

## 3. Navigation cible globale

### Tableau de bord
Projets récents, progression, blocages, avertissements et prochaines actions.

### Cockpit opérationnel
Portefeuille priorisé, blockers/warnings, revues ouvertes, état des catalogues, gates réglementaires, readiness et liens vers les espaces spécialisés.

### Projets de prospectus
Recherche, filtres, création, duplication contrôlée, mise à jour, import gouverné, statut workflow, versions, responsables et activité.

### Bibliothèque réglementaire
Sources officielles, versions, dates d'effet, statuts observés, relations entre textes, exigences atomisées, dépendances, crosswalks, preuves, revues et impacts.

### Studio de clauses
Catalogue, propositions, versions, diff, variables autorisées, exigences liées, source normative, approbateurs, promotion gouvernée et retrait sans réécriture rétroactive.

### Référentiels
États membres, devises, calendriers, sociétés de gestion, dépositaires, commissaires aux comptes, distributeurs, agents payeurs, catégories d'actifs, classifications, risques, frais et méthodes de valorisation.

### Centre de revues
Files Produit, Risque, Opérations, Conformité, Juridique, Fiscal, Sécurité et Audit avec assignation, commentaires, décisions, demandes de correction et journal d'audit.

### Administration et readiness
PostgreSQL, OIDC, object store, KMS, scanner, workers, backup/restore, health/readiness, observabilité, rétention et gates production.

## 4. Workspace cible d'un projet

Navigation cible :

1. Vue d'ensemble
2. Questionnaire
3. Données canoniques
4. Contrôles
5. Couverture / concordance
6. Aperçu document
7. Générations
8. Revues
9. Preuves
10. Imports
11. Versions & diff
12. Commentaires / tâches
13. Audit
14. Readiness du dossier

### Vue d'ensemble
Identité, progression, couverture, blockers/warnings, workflow, revues requises, preuves manquantes, dernière génération et prochaine action.

### Questionnaire intelligent
Sauvegarde continue, progression par groupe, dépendances, raison réglementaire, source/exigence, rôle de revue, preuves attendues, champs canoniques impactés, préremplissage vérifié, contrôles et reprise.

### Données canoniques
Vue champ par champ avec provenance, statut de vérification, historique, consommateur documentaire, exigence liée et diff entre versions.

### Contrôles
BLOCKER/WARNING/INFO, filtres, remédiation, questions et exigences concernées, résolution traçable et re-run déterministe.

### Concordance
Visualisation `Exigence → donnée → question → clause → composant documentaire → preuve → réviseur`.

### Document Studio
Rendu, navigation par section, provenance par paragraphe, comparaison N/N-1, textes spécifiques, DOCX/PDF et génération sans contournement du modèle canonique.

### Générations
Generation ID, snapshot, digest catalogue, DOCX, PDF, JSON, concordance, rapport de contrôles, manifestes, package de revue et diff.

### Revues
Files par rôle, décisions, demandes de modification, commentaires contextualisés, approbation interne, gel de version et séparation des tâches.

### Preuves
Upload en quarantaine, état antivirus, hash, type, émetteur, date, exigences liées, vérification conformité, rétention et legal hold.

### Imports
DOCX/PDF, `EXTRACTED_UNVERIFIED`, valeurs proposées, provenance, revue humaine, acceptation/rejet et promotion explicite.

### Versions & audit
Snapshots, diff champ/document/couverture, acteur, rôle, horodatage, ancienne/nouvelle valeur, justification et chaîne d'intégrité.

## 5. Regulatory Knowledge cible

### Source Explorer
Autorité, juridiction, référence, version, signature, effet, statut observé, URL, SHA-256, taille/pages, extraction, relations et revues.

### Requirement Explorer
Identifiant, source/article, applicabilité, produit, sévérité, preuve, rôles, champs, questions, clauses, contrôles, outputs et validation.

### Dependency Graph
Texte→texte cité, instruction→circulaire, décision→barème, exigence→dépendance, preuve et revue. Une correspondance candidate n'est jamais une résolution juridique automatique.

### Regulatory Change Impact
Nouvelle source/version, diff documentaire, exigences/clauses/projets potentiellement impactés, puis revue humaine avant activation.

## 6. Intelligence assistée

Autorisé : expliquer, retrouver une source, résumer des preuves, comparer, détecter des incohérences, suggérer une remédiation, proposer une clause et assister la navigation.

Interdit sans validation : inventer une obligation, activer un seuil, déclarer une conformité finale, accorder une dispense, valider juridiquement une clause, marquer une sanction applicable ou soumettre un dossier.

## 7. Profils cibles

Administrateur, Produit, Risques, Opérations, Conformité, Juridique, Fiscal, Sécurité, Audit, Lecteur. L'autorisation serveur reste obligatoire.

## 8. États UX communs

Loading, empty, partial, permission denied, external dependency unavailable, stale version, optimistic concurrency conflict, validation failed, review required, immutable/frozen, degraded runtime et production gate closed.

## 9. Design system

Conserver l'identité institutionnelle actuelle : bleu, surfaces claires, badges sémantiques, documents typographiquement distincts, responsive, focus visible, reduced motion et WCAG A/AA automatisé + revue manuelle.

Extensions : command palette, filtres persistants, drawers de détail, timeline, diff viewer, dependency graph, split-view source/document, notifications internes et centre de tâches.

## 10. Roadmap

- **F0 — Baseline** : dashboard, projets, questionnaire, contrôles, preview, revues, preuves, imports, versions, bibliothèque, clauses, readiness.
- **F1 — Cockpit transverse** : portefeuille, priorités, gates, carte de capacités.
- **F2 — Canonical Data + concordance** : provenance et crosswalk interactif.
- **F3 — Regulatory Knowledge avancé** : source/requirement explorer, dependency graph, recherche.
- **F4 — Clause Studio complet** : versioning, diff, approbation, promotion.
- **F5 — Centres de revue** : files, tâches, commentaires, SLA internes.
- **F6 — Document Studio** : générations, diff, provenance, packages.
- **F7 — Référentiels** : UMOA, acteurs, pays, calendriers, classifications.
- **F8 — Operations/Security** : jobs, scanner, stockage, backups, observabilité.
- **F9 — Regulatory Change Intelligence** : ingestion gouvernée, diff et impact analysis.
- **F10 — Production acceptance** : E2E cible, accessibilité manuelle, sécurité, performance, backup/restore, runbooks et décision humaine.

## 11. Première tranche implémentée

- route `/operations` ;
- `OperationsCockpitTemplate` ;
- navigation principale enrichie ;
- test navigateur/accessibilité étendu ;
- aucune API ou modèle canonique modifié ;
- aucune règle réglementaire modifiée ;
- `ready_for_submission=false` préservé.

<!-- AUTO:FRONTEND-F2-CANONICAL-CONCORDANCE-2026-10-05:START -->
## 12. F2 implémenté — Canonical Data + Concordance

F2 est maintenant matérialisé dans le workspace projet.

### Données canoniques
La route /projects/{projectId}/canonical-data réutilise le snapshot canonique du compositeur et expose les chemins, valeurs, questions, sources, review statuses et exigences liées.

### Concordance
La route /projects/{projectId}/concordance construit un crosswalk en lecture seule depuis les registres existants : exigence, question, chemins canoniques, clauses, section documentaire et rôles de revue.

Les vues n'écrivent aucune donnée et ne créent aucune règle de couverture propre. defaultCoverageStatus est présenté explicitement comme statut du catalogue, distinct de l'état factuel du projet.
<!-- AUTO:FRONTEND-F2-CANONICAL-CONCORDANCE-2026-10-05:END -->

<!-- AUTO:FRONTEND-F3-REGULATORY-KNOWLEDGE-2026-10-05:START -->
## 13. F3 implémenté — Regulatory Knowledge

F3 ajoute trois explorateurs read-only issus d'un catalogue généré et hashé :
- /regulatory-library/sources ;
- /regulatory-library/requirements ;
- /regulatory-library/dependencies.

Le générateur lit les catalogues API institutionnels versionnés, les métadonnées des sources matérialisées, les 111 candidats INST066 et l'état courant des 49 dépendances. Il vérifie les frontières fail-closed avant de produire la projection web.

Aucun composant React ne résout une dépendance, n'active une exigence ou ne transforme une matérialisation en validation juridique.
<!-- AUTO:FRONTEND-F3-REGULATORY-KNOWLEDGE-2026-10-05:END -->

<!-- AUTO:FRONTEND-F4-CLAUSE-STUDIO-2026-10-05:START -->
## 14. F4 implémenté — Clause Studio

La route /regulatory-library/clause-proposals devient le Clause Studio et réutilise le lifecycle existant. Elle ne crée aucun mécanisme parallèle.

Le Studio compare la source immuable au texte proposé, expose l'historique append-only, montre les acteurs et garde ACTIVE comme gate fermé puisque CLAUSE_ACTIVATE n'a aucun grant.
<!-- AUTO:FRONTEND-F4-CLAUSE-STUDIO-2026-10-05:END -->

<!-- AUTO:FRONTEND-F5-REVIEW-CENTER-BASELINE-2026-10-05:START -->
## 15. F5 baseline — Centre de revues transverse

La route `/reviews` projette les workspaces de revue existants en lecture seule.

Principes :
- aucune nouvelle table, migration ou permission ;
- lecture via les repositories projet/revue existants ;
- files spécialisées RISK, OPERATIONS, COMPLIANCE, LEGAL, TAX et SECURITY ;
- rôles de décision affichés depuis la politique RBAC existante ;
- lien vers la surface projet pour toute action ;
- aucun bouton d'approbation, rejet, transition ou commentaire transverse ;
- fail-closed lorsque PostgreSQL/OIDC n'est pas disponible ;
- `ready_for_submission=false`.

Cette tranche ne remplace pas le `ReviewWorkspacePanel` projet : elle fournit uniquement la vue portefeuille demandée par F5.
<!-- AUTO:FRONTEND-F5-REVIEW-CENTER-BASELINE-2026-10-05:END -->
