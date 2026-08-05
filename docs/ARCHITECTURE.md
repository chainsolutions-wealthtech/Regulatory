# Architecture fonctionnelle et technique

## 1. Objectif

Cette architecture décrit le système cible permettant de générer un prospectus OPCVM/FCP UMOA complet à partir :

- de référentiels institutionnels ;
- de données statiques du fonds ;
- d’un questionnaire dynamique ;
- d’un corpus réglementaire versionné ;
- d’une bibliothèque de clauses juridiques validées ;
- d’un ensemble de contrôles déterministes ;
- d’un workflow de revue et d’approbation.

Le système doit privilégier une interface simple tout en conservant une profondeur réglementaire, une traçabilité et une capacité de preuve élevées.

## 2. Principes d’architecture

### 2.1 Source de vérité unique

Les informations ne doivent pas être dupliquées entre prospectus, DICI, règlement, site internet et exports.

```text
Une donnée canonique
→ plusieurs vues
→ plusieurs documents
→ plusieurs contrôles
```

### 2.2 Séparation des responsabilités

- les textes définissent les exigences ;
- les exigences déterminent les données nécessaires ;
- les questions collectent ou confirment ces données ;
- les règles contrôlent les données ;
- les clauses transforment les données en rédaction ;
- les modèles organisent les composants ;
- les réviseurs approuvent les écarts et versions finales.

### 2.3 Déterminisme

Pour un même ensemble de :

- données ;
- pack réglementaire ;
- versions de clauses ;
- version de modèle ;
- décisions de couverture ;

le système doit produire le même document et le même rapport de contrôles.

### 2.4 Versionnement intégral

Sont versionnés :

- textes ;
- exigences ;
- champs ;
- questionnaires ;
- options ;
- règles ;
- clauses ;
- modèles ;
- documents générés ;
- décisions de revue.

## 3. Vue d’ensemble

```text
┌──────────────────────────────────────────────────────────────┐
│                    PORTAIL SOCIÉTÉ DE GESTION                │
│ Questionnaire · Référentiels · Preuves · Prévisualisation    │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                  DECISION & QUESTION ENGINE                  │
│ Questions · Conditions · Options · Effets · Assignations     │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                     CANONICAL DATA SERVICE                   │
│ Fonds · Parts · Organisations · Stratégie · Risques · Frais  │
└──────────────┬───────────────────────┬───────────────────────┘
               │                       │
┌──────────────▼─────────────┐ ┌───────▼──────────────────────┐
│ LEGAL KNOWLEDGE BASE       │ │ RULE & CONSISTENCY ENGINE   │
│ Textes · Exigences ·       │ │ Forme · Métier · Réglement. │
│ Clauses · Versions         │ │ Interdocuments · Blocages   │
└──────────────┬─────────────┘ └───────┬──────────────────────┘
               │                       │
               └──────────────┬────────┘
                              │
┌─────────────────────────────▼────────────────────────────────┐
│                      DOCUMENT COMPOSER                       │
│ Sections · Clauses · Tableaux · Annexes · Concordance        │
└─────────────────────────────┬────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────┐
│      REVIEW · APPROVAL · EVIDENCE · AUDIT · PUBLICATION      │
└──────────────────────────────────────────────────────────────┘
```

## 4. Composants

### 4.1 Regulatory Source Registry

Responsabilités :

- enregistrer les textes ;
- conserver les versions ;
- conserver les métadonnées ;
- stocker l’empreinte du fichier ;
- relier les sources officielles ;
- enregistrer les dates d’effet et d’abrogation ;
- déclencher les analyses d’impact.

Entités principales :

```text
RegulatorySource
RegulatorySourceVersion
RegulatoryProvision
RegulatoryCitation
RegulatoryImpactAssessment
```

### 4.2 Regulatory Requirement Registry

Chaque obligation est atomisée.

```text
Requirement
├── id
├── source_version
├── citation
├── jurisdiction
├── product_types
├── document_types
├── title
├── description
├── applicability
├── sequence
├── allowed_coverage_locations
├── evidence_requirements
├── severity
├── effective_period
└── review_status
```

### 4.3 Canonical Data Service

Objets principaux :

```text
RegulatoryContext
Fund
ShareClass
ManagementCompany
GovernanceMember
Depositary
Auditor
AccountingControlPerson
ExternalAdviser
Distributor
PayingAgent
InvestmentPolicy
AssetExposureRange
Benchmark
RiskFactor
NavRule
SubscriptionRule
RedemptionRule
LiquidityManagementTool
FeeAndExpense
ValuationMethod
TaxProfile
DistributionCountryArrangement
HistoricalPerformance
TargetInvestor
Evidence
RegulatoryCoverage
Review
Approval
AuditEvent
```

Le service doit prendre en charge :

- données actuelles ;
- historique ;
- alias ;
- dates d’effet ;
- statut de vérification ;
- provenance ;
- pièces justificatives.

### 4.4 Reference Data Service

Référentiels :

- pays ;
- devises ;
- calendriers ;
- autorités ;
- organisations ;
- agréments ;
- catégories de fonds ;
- catégories d’actifs ;
- risques ;
- frais ;
- méthodes de valorisation ;
- canaux de commercialisation.

### 4.5 Decision & Question Engine

Le questionnaire est un graphe orienté et versionné.

```text
QuestionnaireVersion
QuestionGroup
Question
QuestionOption
DisplayCondition
RequirementCondition
QuestionEffect
AnswerValidation
Answer
AnswerVersion
```

Effets possibles :

- afficher un groupe ;
- masquer un groupe ;
- rendre un champ obligatoire ;
- définir une valeur ;
- proposer un risque ;
- exiger une preuve ;
- sélectionner une clause ;
- exiger une méthode de valorisation ;
- déclencher une règle ;
- demander une revue.

Le changement d’une réponse doit recalculer les effets sans laisser de données orphelines ou de clauses devenues inapplicables.

### 4.6 Clause Library

```text
Clause
ClauseVersion
ClauseVariable
ClauseCondition
ClauseRequirementLink
ClauseApproval
ClauseTranslation
```

Catégories :

- `LOCKED_REGULATORY` ;
- `VALIDATED_PARAMETERIZED` ;
- `CONDITIONAL` ;
- `COMPOSED` ;
- `FACTUAL` ;
- `SPECIFIC_LEGAL_REVIEW_REQUIRED`.

### 4.7 Rule Engine

Types de contrôles :

1. forme ;
2. métier ;
3. réglementaire ;
4. interdocumentaire ;
5. preuve ;
6. version ;
7. workflow.

Niveaux :

```text
INFO
WARNING
BLOCKER
```

Une règle produit :

- résultat ;
- message utilisateur ;
- message technique ;
- champs concernés ;
- exigence concernée ;
- source ;
- remédiation ;
- rôle responsable.

### 4.8 Coverage Engine

Pour chaque exigence :

```text
IN_PROSPECTUS
IN_ATTACHED_REGULATION
IN_ATTACHED_CONSTITUTIVE_DOCUMENT
NOT_APPLICABLE
PENDING_REVIEW
MISSING
```

Le statut `NOT_APPLICABLE` exige une justification et peut exiger une approbation.

### 4.9 Document Composer

Composants pris en charge :

```text
Cover
Heading
Paragraph
Warning
Table
List
Callout
CrossReference
Footnote
Appendix
SignatureBlock
PageBreak
```

Entrées :

- snapshot de données ;
- pack réglementaire ;
- clauses ;
- modèle ;
- couverture ;
- décisions de revue.

Sorties :

- DOCX ;
- PDF ;
- JSON ;
- table de concordance ;
- rapport de complétude ;
- rapport de contrôles ;
- manifeste de génération.

### 4.10 Evidence Service

Chaque donnée sensible doit pouvoir référencer :

- document ;
- version ;
- page ou emplacement ;
- type ;
- émetteur ;
- date ;
- validité ;
- statut de revue ;
- empreinte ;
- accès.

### 4.11 Workflow Service

Rôles initiaux :

```text
DATA_CONTRIBUTOR
FUND_MANAGER
RISK_REVIEWER
COMPLIANCE_REVIEWER
LEGAL_REVIEWER
TAX_REVIEWER
MANAGEMENT_APPROVER
SYSTEM_ADMIN
AUDITOR
```

Le workflow doit empêcher une même personne d’effectuer toutes les validations sensibles si une séparation des tâches est configurée.

### 4.12 Audit Service

Événements :

- création ;
- modification ;
- import ;
- validation ;
- rejet ;
- génération ;
- téléchargement ;
- soumission ;
- commentaire du régulateur ;
- publication ;
- remplacement.

Un audit event contient :

- acteur ;
- date ;
- objet ;
- ancienne valeur ;
- nouvelle valeur ;
- raison ;
- version ;
- source ;
- corrélation.

## 5. Organisation logique des données

### 5.1 Référentiel institutionnel

Une organisation peut assurer plusieurs rôles.

```text
Organization
├── LegalIdentity
├── Addresses
├── Registrations
├── Approvals
├── Governance
├── CapitalHistory
├── Contacts
├── Documents
└── Roles
```

Éviter une duplication complète entre `ManagementCompany`, `Depositary` et `ExternalAdviser`. Ces objets doivent référencer une organisation commune et ajouter des propriétés propres au rôle.

### 5.2 Fonds et classes

```text
Fund 1 ─── n ShareClass
Fund 1 ─── 1 InvestmentPolicy
Fund 1 ─── n AssetExposureRange
Fund 1 ─── n RiskFactor
Fund 1 ─── n FeeAndExpense
Fund 1 ─── n ValuationMethod
Fund 1 ─── n DistributionCountryArrangement
```

Les frais, devises, revenus et minimums peuvent être définis au niveau du fonds ou de la classe. Le modèle doit gérer l’héritage et les exceptions.

### 5.3 Temporalité

Toutes les données réglementaires et institutionnelles significatives doivent prendre en charge :

```text
valid_from
valid_to
recorded_at
verified_at
superseded_by
```

## 6. Flux de création d’un prospectus

```text
Créer le projet
→ sélectionner la SGO
→ choisir le produit
→ sélectionner le pack
→ charger les données préremplies
→ construire le graphe applicable
→ collecter les réponses
→ collecter les preuves
→ exécuter les contrôles
→ résoudre les blocages
→ composer l’aperçu
→ revue conformité
→ revue juridique
→ approbation direction
→ geler le snapshot
→ générer les livrables
→ préparer la soumission
```

## 7. Flux de mise à jour

```text
Sélectionner le prospectus publié
→ charger son snapshot
→ identifier les nouvelles données
→ identifier les nouvelles règles
→ calculer les impacts
→ poser uniquement les questions modifiées
→ générer le diff
→ relancer les contrôles
→ revue et approbation
→ publier une nouvelle version
→ conserver l’ancienne version
```

## 8. Import d’un prospectus existant

L’import doit :

- conserver le fichier original ;
- extraire les données ;
- associer chaque valeur à un champ canonique ;
- conserver la provenance page/zone ;
- indiquer le niveau de confiance ;
- demander confirmation ;
- ne jamais considérer une extraction comme vérifiée sans validation ou source fiable.

## 9. Cohérence interdocumentaire

Le moteur doit définir des contraintes telles que :

```text
prospectus.share_class.currency
= dici.share_class.currency
= website.share_class.currency
= openfunds.share_class.currency
```

Les documents ne doivent pas stocker leur propre copie indépendante de la donnée.

## 10. Sécurité et confidentialité

Principes :

- moindre privilège ;
- chiffrement en transit et au repos ;
- séparation des environnements ;
- coffre de secrets ;
- journalisation ;
- contrôle d’accès aux pièces ;
- rétention configurable ;
- protection contre les modifications rétroactives ;
- signatures ou empreintes des versions finales.

## 11. Choix techniques à valider

Les choix suivants restent ouverts et doivent faire l’objet de décisions documentées :

- langage et framework backend ;
- moteur de règles ;
- format des règles ;
- stockage relationnel et JSON ;
- moteur de génération DOCX ;
- moteur de conversion PDF ;
- stockage des fichiers ;
- moteur de workflow ;
- stratégie de signature ;
- stratégie de recherche dans le corpus réglementaire ;
- infrastructure d’hébergement.

Aucun choix ne doit être figé uniquement parce qu’il est populaire. Il doit être évalué par rapport à la traçabilité, au déterminisme, à la maintenance et à la sécurité.

<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:START -->
## Adaptateur du snapshot web vers le compositeur historique

Le flux exécutable est désormais :

`matrices CSV + registre YAML → catalogue JSON → questionnaire/API → canonical-snapshot.json → adaptateur web → compositeur historique → modèle documentaire + Markdown + concordance + contrôles + DOCX`.

L’adaptateur se situe dans la couche `src/adapters`. Le compositeur historique reste responsable des clauses, sections, règles, contrôles et concordances. Next.js orchestre la création du snapshot et la persistance des artefacts, sans devenir une seconde implémentation des règles réglementaires.
<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:START -->
## Pattern des collections structurées

La première implémentation de référence est `share_classes[]` :

`Question CIRC005 → composant structuré → validation serveur → réponse versionnée → collection canonique → compositeur historique → DOCX`.

Le même pattern doit être réutilisé pour les fourchettes d’allocation, frais, méthodes de valorisation et intervenants. Les identifiants CIRC005 ne changent pas ; seul le composant de saisie devient plus précis.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:START -->
## Pattern canonique des collections structurées V1

`Question canonique → composant Atomic Design → normalisation → validation API → réponse versionnée → tableau canonique → contrôles intercollections → compositeur → DOCX`.

Dix collections utilisent ce pattern. Les identifiants réglementaires et la traçabilité ne changent pas. Les données sélectionnées simples, telles que les codes pays, sont séparées des objets détaillés afin d’éviter toute collision canonique.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:END -->

<!-- AUTO:LOOP-DEV-001-CANONICAL-SCHEMA-POSTGRES-V1:START -->
## Contrat de données et ports de persistance

Le domaine consomme `ProjectRepository` et non directement le système de fichiers. Le driver `local-json` sert au prototype. La cible PostgreSQL conserve à la fois le snapshot JSON exact et les collections normalisées, dans une transaction unique.

- contrat : `PROSPECTUS_CANONICAL_MODEL_V1.schema.json` ;
- standard : JSON Schema draft 2020-12 ;
- collections structurées couvertes : `10` ;
- tables PostgreSQL : `25` ;
- tables avec RLS activée : `18` ;
- politiques tenant : `18` ;
- versions gelables : `IMPLEMENTED` ;
- audit append-only : `IMPLEMENTED` ;
- soumission verrouillée à `false` : `IMPLEMENTED` ;
- migration exécutée sur PostgreSQL éphémère en CI : `PASS` ;
- stockage actif dans l’application : `local-json` ;
- adaptateur PostgreSQL applicatif : `NOT_ACTIVATED`.

La RLS complète les contrôles d’autorisation applicatifs ; elle ne les remplace pas.
<!-- AUTO:LOOP-DEV-001-CANONICAL-SCHEMA-POSTGRES-V1:END -->
