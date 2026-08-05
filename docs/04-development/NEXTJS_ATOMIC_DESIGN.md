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
## 9. Catalogue réglementaire généré

Les composants Atomic Design ne dépendent plus d’un tableau réglementaire écrit manuellement en TypeScript. Le catalogue est généré avant le développement, le typecheck et le build depuis les quatre matrices CIRC005 et le registre YAML.

- exigences chargées depuis les matrices : `62` ;
- questions réglementaires interactives : `58` ;
- questions système : `4` ;
- groupes réglementaires générés : `16` ;
- identifiants d’exigence uniques : `62` ;
- identifiants de question uniques : `62` ;
- empreinte du catalogue : `c1f288bcc865becee580e52049ea4757ecd7e1fc97fcccd3f4b61aba3089ea1b` ;
- test d’intégration API : `PASS` ;
- soumission automatique : `false`.

Les objets de présentation conservent les identifiants, champs canoniques, effets, contrôles, preuves, rôles, sections et références sources. Les composants spécialisés encore absents utilisent une saisie provisoire explicitement signalée.
<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:END -->
