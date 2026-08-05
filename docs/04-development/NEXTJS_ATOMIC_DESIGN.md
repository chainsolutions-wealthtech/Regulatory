# Architecture Next.js et Atomic Design

> **Application :** `apps/web`  
> **Statut :** `EXECUTABLE_PROTOTYPE`  
> **Cadre :** prototype local de pré-conformité, non déployé et non prêt pour la production.

## 1. Décision

L’interface du Prospectus Composer est construite avec Next.js App Router, React et TypeScript. La décomposition visuelle suit Atomic Design afin de séparer les primitives, les assemblages réutilisables, les régions fonctionnelles et les compositions de pages.

Le choix ne modifie pas la source de vérité réglementaire. Les matrices, exigences, règles, données canoniques et sorties du moteur restent dans les modules historiques du dépôt. L’application web les consomme au moyen d’adaptateurs.

## 2. Structure

```text
apps/web/
├── src/app/                    # routes, pages et Route Handlers Next.js
├── src/components/
│   ├── atoms/                  # Button, Badge, Field, Icon, ProgressBar
│   ├── molecules/              # QuestionCard, ProjectRow, ControlAlert
│   ├── organisms/              # AppShell, Wizard, ProjectHero, Preview
│   └── templates/              # Dashboard, Projects, Workspace, New Project
├── src/domain/                 # types, catalogue et règles de progression
├── src/data/                   # cas de référence non normatif
└── src/server/                 # persistance locale et génération
```

## 3. Responsabilités Atomic Design

### Atoms

Primitives sans connaissance du domaine : bouton, badge, champ, icône, logo et progression.

### Molecules

Assemblages simples : carte statistique, ligne de projet, alerte de contrôle, question avec son champ et ses métadonnées.

### Organisms

Blocs fonctionnels : navigation, shell, en-tête projet, stepper, espace questionnaire, résumé des contrôles et aperçu documentaire.

### Templates

Compositions de pages indépendantes d’un projet particulier : tableau de bord, liste des projets, création et espace de travail.

### Pages

Les routes App Router chargent les données côté serveur et composent les templates. Les composants client sont limités aux interactions qui nécessitent un état local : formulaire, auto-sauvegarde et génération.

## 4. Parcours implémenté

```text
Tableau de bord
→ création d’un projet
→ questionnaire en 18 groupes
→ enregistrement versionné des réponses
→ recalcul de la progression
→ contrôles bloquants et avertissements
→ couverture CIRC005
→ aperçu du prospectus
→ snapshot de génération
```

Le catalogue contient des questions couvrant : projet, SGO, fonds, parts, acteurs, objectif, portefeuille, risques, VL, souscriptions/rachats, revenus, frais, valorisation, fiscalité, commercialisation, performances, preuves et revue.

## 5. Persistance

Le prototype utilise une persistance JSON locale sous `apps/web/.local-data/` :

```text
.local-data/projects/<project-id>/
├── current.json
├── versions/00001.json
└── audit.ndjson
```

Cette persistance :

- versionne chaque modification ;
- écrit un événement d’audit ;
- interdit les identifiants de chemin non sûrs ;
- n’est pas adaptée à un déploiement serverless ou multi-tenant ;
- doit être remplacée par une base transactionnelle avant la production.

## 6. API locale

Routes disponibles :

```text
GET  /api/projects
POST /api/projects
GET  /api/projects/:projectId
GET  /api/projects/:projectId/questions
POST /api/projects/:projectId/answers
POST /api/projects/:projectId/generate
```

Aucune authentification fictive n’est présentée comme sécurisée. Les endpoints sont destinés au développement local seulement.

## 7. Règles de non-régression

- ne pas déplacer le moteur réglementaire dans les composants React ;
- ne pas dupliquer les identifiants `CIRC005_*` ;
- conserver `ready_for_submission = false` ;
- ne jamais transformer un `PENDING_REVIEW` en validation implicite ;
- utiliser des Server Components par défaut ;
- limiter les Client Components aux interactions ;
- conserver une structure atomique sans composants monolithiques ;
- versionner les réponses et les générations ;
- ne pas déployer avant l’authentification, le RBAC, la séparation tenant et la persistance de production.

## 8. Prochaines étapes

1. relier chaque question web au catalogue exécutable issu des matrices plutôt qu’au catalogue TypeScript provisoire ;
2. adapter le moteur de génération à tout projet, pas uniquement au cas United Capital Diamond ;
3. ajouter les tests d’intégration des Route Handlers ;
4. ajouter la base PostgreSQL et les migrations ;
5. implémenter authentification, RBAC et séparation des sociétés de gestion ;
6. construire le workflow de revue ;
7. brancher l’export DOCX déterministe sur les projets créés depuis l’interface ;
8. effectuer la revue visuelle navigateur desktop et mobile.

<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:START -->
## 10. Sortie documentaire réelle

Le parcours Atomic Design n’aboutit plus à un simple aperçu. L’action de génération construit un snapshot canonique, appelle le compositeur historique et persiste le bundle documentaire complet.

- exigences chargées depuis les matrices : `62` ;
- questions réglementaires interactives : `58` ;
- questions système : `4` ;
- groupes réglementaires générés : `16` ;
- identifiants d’exigence uniques : `62` ;
- identifiants de question uniques : `62` ;
- empreinte du catalogue : `c1f288bcc865becee580e52049ea4757ecd7e1fc97fcccd3f4b61aba3089ea1b` ;
- test d’intégration API : `PASS` ;
- compositeur documentaire historique invoqué : `true` ;
- bundle documentaire complet persisté : `true` ;
- DOCX déterministe validé : `true` ;
- soumission automatique : `false`.

La prochaine évolution doit remplacer les champs génériques représentant des tableaux et collections par des organismes dédiés : classes de parts, fourchettes d’actifs, frais, méthodes de valorisation, intervenants et autres listes répétables.
<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:START -->
## 11. Organisme répétable de référence : classes de parts

`ShareClassCollectionField` gère l’ajout, la suppression et la validation de lignes contenant : identifiant, devise, politique de revenus, VL d’origine, minimum initial de souscription et règle de décimalisation.

- composant dédié : `SHARE_CLASS_COLLECTION` ;
- question canonique conservée : `Q_SHARE_CLASSES_COUNT` ;
- exigence conservée : `CIRC005_1_10_FCP_PARTS_CHARACTERISTICS` ;
- validation ligne par ligne et unicité des identifiants : `PASS` ;
- migration non destructive des anciennes valeurs booléennes : `IMPLEMENTED` ;
- écriture directe dans `canonicalData.share_classes[]` : `PASS` ;
- stockage provisoire dans `_repeating.share_classes` : `REMOVED` ;
- génération par le compositeur historique et DOCX déterministe : `PASS` ;
- `ready_for_submission` : `false`.

Ce composant constitue la référence pour les prochains tableaux éditables.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:START -->
## 11. Éditeur partagé des collections canoniques

`StructuredCollectionField` rend les lignes d’allocation, frais, valorisation, intervenants, risques, pays et justificatifs depuis des définitions de champs typées. `ShareClassCollectionField` reste l’éditeur spécialisé des classes de parts.

- collections structurées testées : `10` ;
- classes de parts : `share_classes[]` ;
- fourchettes d’allocation : `investment_policy.asset_class_ranges[]` ;
- frais transactionnels : `fees.transaction[]` ;
- rémunérations : `remunerations[]` ;
- méthodes de valorisation : `valuation.methods[]` ;
- gouvernance : `manager.governance_members[]` ;
- intervenants : `service_providers[]` ;
- risques : `risks[]` ;
- dispositifs pays : `distribution_countries[]` ;
- justificatifs : `evidence[]` ;
- repli de ces collections dans `_repeating` : `REMOVED` ;
- test HTTP complet : `PASS` ;
- compositeur historique et DOCX déterministe : `PASS` ;
- `ready_for_submission` : `false`.

Les validations décisives sont répétées côté serveur ; l’interface seule n’est jamais considérée comme une frontière de confiance.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:END -->
