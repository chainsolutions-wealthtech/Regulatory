# SUIVI.md

Journal chronologique du projet `Regulatory`.

Ce fichier doit être mis à jour au fur et à mesure. Il constitue, avec `README.md`, `TODO.md`, `docs/DECISIONS.md` et les commits Git, la mémoire opérationnelle du projet.

---

## 2026-08-04 — Initialisation du dépôt et consolidation du cadrage

### Objectif

Initialiser la documentation de référence du futur module de génération de prospectus OPCVM/FCP UMOA et inscrire les règles de continuité, de documentation et de non-régression dans le dépôt.

### État du dépôt avant intervention

- dépôt privé : `chainsolutions-wealthtech/Regulatory` ;
- branche par défaut : `main` ;
- un seul commit initial ;
- seul fichier présent : `README.md` contenant uniquement le titre `# Regulatory` ;
- aucun code applicatif ;
- aucune architecture, spécification, matrice ou règle de contribution préexistante.

### Périmètre confirmé

Le premier pack réglementaire cible :

- juridiction UMOA ;
- autorité AMF-UMOA ;
- OPCVM ;
- forme prioritaire FCP ;
- création et mise à jour de prospectus ;
- questionnaire simple et conditionnel ;
- génération documentaire complète ;
- revue humaine obligatoire avant soumission.

### Documents analysés dans le cadrage

- un prospectus FCP agréé, utilisé comme cas d’étude de la structure documentaire ;
- la Position-Recommandation AMF France DOC-2020-06, utilisée uniquement comme inspiration méthodologique et non comme source juridique du pack UMOA ;
- l’Instruction n°66/CREPMF/2021, identifiée comme texte source majeur à intégrer au corpus ;
- la Circulaire n°05/CREPMF/2022 relative au contenu du prospectus des OPC, intégrée comme source structurante de l’annexe réglementaire.

### Décisions fonctionnelles consolidées

1. La société de gestion ne doit pas rédiger le prospectus de manière libre.
2. Elle doit décrire son fonds au moyen d’informations statiques, de choix guidés et de réponses conditionnelles.
3. Les informations institutionnelles doivent être préchargées et réutilisables.
4. Le questionnaire doit être un graphe de décision.
5. Les formulations juridiques doivent être stockées dans une bibliothèque versionnée.
6. Chaque clause doit être reliée à ses exigences, variables, conditions et approbateurs.
7. Le prospectus doit être construit de bout en bout par un moteur documentaire déterministe.
8. Chaque exigence doit être couverte dans le prospectus, dans un règlement annexé, dans un document constitutif annexé ou être justifiée comme non applicable.
9. Une table de concordance doit être générée automatiquement.
10. La conformité automatisée ne remplace pas la revue juridique, conformité, fiscale ni la décision du régulateur.
11. Les données canoniques doivent alimenter plusieurs documents sans ressaisie.
12. Les modifications réglementaires doivent être versionnées et faire l’objet d’une analyse d’impact.

### Architecture fonctionnelle retenue

Trois moteurs principaux :

- `LEGAL KNOWLEDGE BASE` ;
- `DECISION & QUESTION ENGINE` ;
- `DOCUMENT COMPOSER`.

Services complémentaires :

- modèle canonique ;
- moteur de règles ;
- moteur de cohérence interdocumentaire ;
- gestion des preuves ;
- workflow de revue ;
- journal d’audit ;
- gestion des versions et impacts réglementaires.

### Référentiels à précharger

- pays et juridictions ;
- sociétés de gestion ;
- agréments ;
- dirigeants et organes ;
- dépositaires ;
- commissaires aux comptes ;
- conseillers externes ;
- distributeurs et agents payeurs ;
- autres OPC gérés ;
- classifications de fonds ;
- classes d’actifs ;
- risques ;
- frais ;
- méthodes de valorisation ;
- clauses juridiques ;
- règles et preuves.

### Exigences importantes ajoutées à partir de la Circulaire n°05/CREPMF/2022

- respect de l’ordre réglementaire ;
- localisation de chaque information entre prospectus et annexes ;
- distinction siège statutaire / administration centrale ;
- autres OPC gérés ;
- capital souscrit / capital libéré ;
- personnes chargées du contrôle des données comptables ;
- activités externes significatives des dirigeants ;
- nature juridique des parts ;
- titres, certificats, registre ou compte ;
- forme nominative ou au porteur ;
- coupons et droits de vote ;
- droits en liquidation ;
- cotation ou négociation ;
- émission, vente, rachat, remboursement et suspension ;
- détermination et affectation des revenus ;
- capacités d’emprunt ;
- prix d’émission et de rachat ;
- publication des prix ;
- rémunérations et remboursements de frais ;
- activité principale du dépositaire ;
- conseillers externes et clauses importantes de leurs contrats ;
- dispositifs de paiement et d’information par État membre ;
- performances historiques ;
- investisseur-type ;
- informations d’ordre économique ;
- ventilation des dépenses entre porteur et actif du fonds.

### Règles Git et de continuité décidées

- aucune nouvelle branche ne doit être créée automatiquement par un agent connecté ;
- l’agent doit conserver la branche existante désignée ;
- `main` est utilisée lorsqu’aucune autre branche existante n’a été expressément désignée ;
- lecture obligatoire de toute la documentation structurante avant modification ;
- analyse de l’existant avant création d’un nouveau composant ;
- documentation continue ;
- aucun force push ;
- aucune réécriture d’historique ;
- aucune modification sans analyse de non-régression.

### Fichiers documentaires initialisés

- `README.md` ;
- `AGENTS.md` ;
- `CONTRIBUTING.md` ;
- `SUIVI.md` ;
- `TODO.md` ;
- `CHANGELOG.md` ;
- `.github/CODEOWNERS` ;
- `.github/copilot-instructions.md` ;
- `docs/ARCHITECTURE.md` ;
- `docs/DECISIONS.md` ;
- `docs/PROSPECTUS_ENGINE_SPEC.md` ;
- `docs/REGULATORY_MAPPING.md`.

### Résultat

Le dépôt dispose désormais d’une base documentaire conçue pour empêcher les interventions isolées, les duplications, les changements de logique non documentés et les régressions silencieuses.

### Limites actuelles

- le corpus réglementaire complet n’est pas encore archivé dans le dépôt ;
- l’Instruction n°66/CREPMF/2021 n’est pas encore atomisée point par point ;
- les textes complémentaires ne sont pas encore inventoriés ;
- aucune validation par un juriste ou responsable conformité n’est enregistrée ;
- le modèle canonique n’est pas encore implémenté ;
- aucune base de données ni interface n’existe ;
- aucune clause n’a encore le statut `APPROVED` ou `ACTIVE` ;
- aucun test automatisé n’existe encore.

### Prochaine étape prioritaire

Construire le registre des sources réglementaires puis la matrice complète :

```text
exigence
→ champ canonique
→ provenance
→ question
→ options
→ conditions
→ effets
→ clause
→ contrôle
→ preuve
→ section
→ rôle de revue
```

---

## 2026-08-04 — Première atomisation machine-readable de la Circulaire n°05/CREPMF/2022

### Objectif

Passer du cadrage documentaire à une première base réglementaire exploitable par une future application, sans créer de branche et sans modifier la logique validée.

### État initial vérifié

- branche conservée : `main` ;
- dernier commit lu : `cb60b1dfc0ad5611f0e31c14da16bb5b471b0e56` ;
- documentation obligatoire relue ;
- aucune structure de données machine-readable ne préexistait ;
- le mapping Markdown de la circulaire était initial et partiellement atomisé ;
- l’Instruction n°66/CREPMF/2021 restait à atomiser.

### Travail réalisé

1. Enregistrement des métadonnées de la Circulaire n°05/CREPMF/2022 dans un fichier YAML dédié.
2. Enregistrement de la provenance du scan transmis par le propriétaire :
   - nom d’origine ;
   - nombre de pages ;
   - taille ;
   - empreinte SHA-256 ;
   - méthode d’extraction ;
   - statut de vérification.
3. Création d’un index machine-readable de **62 exigences V1** applicables au parcours FCP/SGO :
   - règles transversales ;
   - exigences FCP ;
   - exigences société de gestion ;
   - dépositaire ;
   - conseiller externe ;
   - dispositifs par État ;
   - performances, investisseur-type, informations économiques et dépenses.
4. Attribution d’identifiants stables, d’un ordre, d’une référence de page et de conditions d’applicabilité.
5. Création d’une première architecture canonique V0.1 comprenant **30 objets principaux**.
6. Création de quatre matrices CSV avec séparateur `;`, comportant au total **62 lignes**, reliant chaque exigence à :
   - champs canoniques ;
   - question ;
   - type de question ;
   - options ;
   - effets ;
   - groupe de clauses ;
   - contrôles ;
   - preuves ;
   - section de sortie ;
   - rôles de revue ;
   - statut d’implémentation.
7. Création d’un manifeste de validation structurelle.

### Décisions prises

- Les nouveaux artefacts machine-readable sont ajoutés sans réorganiser prématurément l’ensemble des fichiers Markdown.
- L’organisation documentaire Markdown demeure provisoire, car le propriétaire a annoncé l’envoi prochain d’un prompt complet destiné à créer et organiser tous les fichiers `.md`.
- Aucun nouveau fichier Markdown de taxonomie générale n’est ajouté avant réception et analyse de ce prompt, sauf mise à jour des fichiers de suivi obligatoires.
- Le statut `SPECIFIED_NOT_IMPLEMENTED` distingue clairement une exigence spécifiée d’une exigence réellement codée et testée.
- La validation réalisée est structurelle ; elle ne constitue pas une validation juridique.

### Fichiers créés

- `regulatory/sources/CIRC005_CREPMF_2022.yaml` ;
- `regulatory/requirements/CIRC005_FCP_REQUIREMENTS_V0_1.yaml` ;
- `regulatory/matrices/CIRC005_FCP_MATRIX_01_GENERAL_IDENTITY_TAX.csv` ;
- `regulatory/matrices/CIRC005_FCP_MATRIX_02_PARTS_OPERATIONS.csv` ;
- `regulatory/matrices/CIRC005_FCP_MATRIX_03_INVESTMENT_PRICING.csv` ;
- `regulatory/matrices/CIRC005_FCP_MATRIX_04_ACTORS_COUNTRY_OTHER.csv` ;
- `regulatory/validation/CIRC005_FCP_BOOTSTRAP_VALIDATION.json` ;
- `schemas/UMOA_FCP_CANONICAL_MODEL_V0_1.yaml`.

### Fichiers modifiés

- `SUIVI.md` ;
- `TODO.md` ;
- `CHANGELOG.md`.

### Tests et contrôles

- unicité des identifiants d’exigence : réussie ;
- présence de l’ordre pour chaque exigence : réussie ;
- unicité des références de matrice : réussie ;
- résolution de chaque référence de matrice vers une exigence existante : réussie ;
- couverture des 62 exigences V1 par les 62 lignes de matrice : réussie ;
- vérification du séparateur CSV `;` : réussie ;
- conservation de la branche `main` : réussie ;
- absence de création de branche : réussie ;
- absence de réécriture d’historique : réussie.

### Résultats

La première chaîne de traçabilité exploitable par une application existe désormais :

```text
source
→ exigence
→ champ canonique
→ question
→ option
→ effet
→ groupe de clauses
→ contrôle
→ preuve
→ section
→ rôle de revue
```

### Limitations ou points à vérifier

- la date officielle de publication et l’état juridique actuel de la circulaire doivent encore être confirmés dans le registre officiel ;
- le PDF source binaire n’a pas été archivé dans GitHub par le connecteur utilisé ; son empreinte et sa provenance sont enregistrées ;
- l’Instruction n°66/CREPMF/2021 n’est pas encore atomisée ;
- les champs canoniques ne possèdent pas encore tous leur type, cardinalité, enum, sensibilité et règle de migration ;
- aucune clause juridique n’est encore `APPROVED` ou `ACTIVE` ;
- les contrôles décrits ne sont pas encore implémentés dans un moteur ;
- la validation juridique et conformité reste à obtenir ;
- l’organisation finale des fichiers Markdown sera complétée après réception du prompt annoncé par le propriétaire.

### Prochaine étape

1. recevoir et analyser le prompt complet d’organisation des fichiers `.md` sans effacer les documents ni décisions existants ;
2. atomiser l’Instruction n°66/CREPMF/2021 à partir d’une copie source vérifiable ;
3. enrichir le modèle canonique au niveau de chaque champ ;
4. créer les premiers catalogues de questions, options, règles et clauses en conservant les identifiants créés.

---

## Modèle obligatoire pour les prochaines entrées

```markdown
## AAAA-MM-JJ — Titre de l’intervention

### Objectif

### État initial vérifié

### Travail réalisé

### Décisions prises

### Fichiers modifiés

### Tests et contrôles

### Résultats

### Limitations ou points à vérifier

### Prochaine étape
```

---

## 2026-08-05 — Intégration complète et additive du kit Loop Engineering

### Objectif

Intégrer l’architecture documentaire du kit `loop-engineering-starter-kit` version `1.0.0` dans le dépôt existant, sans recommencer le projet, sans créer de modèle documentaire concurrent et sans modifier les artefacts réglementaires machine-readable déjà produits.

### État initial vérifié

- dépôt : `chainsolutions-wealthtech/Regulatory` ;
- branche conservée : `main` ;
- commit de départ : `7433be04ce00d0108c1e01441d5e49f01fb994f4` ;
- `21` fichiers au total, dont `11` Markdown et `10` non Markdown ;
- documents canoniques historiques présents : `README.md`, `AGENTS.md`, `SUIVI.md`, `TODO.md`, `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/PROSPECTUS_ENGINE_SPEC.md`, `docs/REGULATORY_MAPPING.md` ;
- artefacts présents : source YAML, registre de `62` exigences, quatre matrices CSV, validation JSON et modèle canonique de `30` objets ;
- une seule branche GitHub présente lors du contrôle préparatoire final : `main` ;
- kit reçu : `177` fichiers, dont `176` Markdown et `manifest.json` ;
- ZIP : `112477` octets ; SHA-256 `8054b1ea4799364b5d709166536c927b2e28ddd47aba84553469a5469ffecc95`.

### Matrice d’intégration

`DOCUMENT_INTEGRATION_MATRIX.md` a été créée avant la finalisation pour classer les chemins selon les actions autorisées : conservation, enrichissement additif, création canonique, création de registre, adaptateur, index, modèle, module conditionnel ou archivage documentaire. Aucune action de suppression, remplacement ou renommage n’a été retenue.

### Travail réalisé

1. Création de `00_START_HERE.md` avec l’ordre de lecture définitif.
2. Création de `SOURCE_OF_TRUTH.md` avec la hiérarchie d’autorité.
3. Création et clôture de `LOOP-GOV-001` et `TASK-GOV-001`.
4. Création des registres `STATUS.md`, `LOOP_STATE.md`, `CURRENT_ITERATION.md`, `WORK_LOG.md`, `HANDOFF.md` et `NEXT_ACTION.md`.
5. Création de tous les chemins Markdown du kit absents du dépôt.
6. Création des adaptateurs et index empêchant la duplication de l’architecture, des décisions et des règles agents.
7. Création des documents spécialisés dans `docs/01-governance/` à `docs/12-optional/`.
8. Création des modèles GitHub et documents d’adaptation IA.
9. Création de sept ADR de gouvernance.
10. Conservation documentaire du ZIP sous `docs/kits/` en neuf fragments Base64, avec empreinte de référence.
11. Enrichissement additif de `README.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `CHANGELOG.md`, `SUIVI.md` et `TODO.md`.
12. Mise à jour des registres de clôture et de reprise.

### Fichiers créés

- `192` fichiers ont été créés depuis le commit de départ ;
- `183` sont des fichiers Markdown ;
- `9` sont les fragments Base64 de l’archive documentaire ;
- le dépôt contient désormais `213` fichiers au total et `194` fichiers Markdown.

Les `176` chemins Markdown prévus par le kit sont présents. Les créations supplémentaires correspondent notamment aux sept ADR de gouvernance et aux documents propres à l’intégration, après prise en compte des chemins du kit qui existaient déjà au départ.

### Fichiers enrichis

Documents historiques enrichis sans suppression de leurs contenus antérieurs :

- `README.md` ;
- `AGENTS.md` ;
- `.github/copilot-instructions.md` ;
- `CHANGELOG.md` ;
- `SUIVI.md` ;
- `TODO.md`.

Registres et documents nouveaux finalisés après leur création :

- `STATUS.md` ;
- `LOOP_STATE.md` ;
- `CURRENT_ITERATION.md` ;
- `WORK_LOG.md` ;
- `NEXT_ACTION.md` ;
- `HANDOFF.md` ;
- `MANIFEST.md` ;
- `DOCUMENT_INTEGRATION_MATRIX.md` ;
- `docs/09-loop/LOOP_HEALTH_CHECK.md`.

### Fichiers conservés

Ont notamment été conservés sans réécriture métier :

- `CONTRIBUTING.md` ;
- `.github/CODEOWNERS` ;
- `docs/DECISIONS.md` ;
- `docs/ARCHITECTURE.md` ;
- `docs/PROSPECTUS_ENGINE_SPEC.md` ;
- `docs/REGULATORY_MAPPING.md` ;
- tous les fichiers antérieurs sous `regulatory/` et `schemas/`.

### Décisions prises

- les documents historiques restent canoniques selon `SOURCE_OF_TRUTH.md` ;
- les nouveaux chemins équivalents sont des adaptateurs ou index ;
- `SUIVI.md` reste l’historique, `STATUS.md` l’état instantané et `TODO.md` le registre opérationnel principal ;
- les conversations ne sont pas une source de vérité ;
- les modules conditionnels sont créés avec statut explicite et questions ouvertes associées ;
- la clôture de la boucle est documentaire et ne vaut pas validation juridique ou réglementaire.

### ADR créées

- `ADR-0001-adoption-du-loop-engineering.md` ;
- `ADR-0002-maintien-du-depot-git-comme-source-de-verite.md` ;
- `ADR-0003-maintien-de-la-politique-de-branche-du-depot.md` ;
- `ADR-0004-documentation-integree-au-changement.md` ;
- `ADR-0005-non-regression-et-preuves-obligatoires.md` ;
- `ADR-0006-contexte-canonique-commun-aux-agents.md` ;
- `ADR-0007-coexistence-des-chemins-documentaires-historiques-et-du-kit.md`.

### Tests et contrôles

- comparaison de l’arbre au commit de départ avec l’arbre final ;
- nombre Markdown initial : `11` ;
- nombre Markdown final : `194` ;
- présence des chemins du kit : `176/176` ;
- fichiers du kit vides : `0` ;
- fichiers du kit limités à un titre : `0` ;
- fichiers supprimés : `0` ;
- vérification des documents canoniques et adaptateurs essentiels ;
- vérification des blobs des artefacts sous `regulatory/` et `schemas/` ;
- vérification de la branche : `main` uniquement lors du contrôle ;
- aucune création ou permutation de branche ;
- aucun force-push, fusion, migration ou déploiement ;
- recherche ciblée de secrets et inspection des contenus ajoutés ;
- mise en cohérence de `MANIFEST.md`, `DOCUMENT_INTEGRATION_MATRIX.md`, des registres d’état et du handoff.

### Résultats

La taxonomie Loop Engineering est intégrée comme couche de gouvernance du projet existant. Les décisions, identifiants, matrices, sources, schéma et résultats antérieurs sont préservés. La boucle est clôturée et une seule prochaine action est définie.

### Limitations ou points à vérifier

- la validation est documentaire et structurelle, pas juridique ;
- aucun crawler exhaustif de tous les liens Markdown n’a été exécuté, même si les liens canoniques essentiels ont été contrôlés ;
- aucun scanner de secrets dédié ou pipeline de CI n’est encore défini ;
- l’archive Base64 doit être reconstruite et comparée au SHA-256 avant utilisation binaire ;
- la date officielle de publication et le statut juridique actuel de la Circulaire n°05/CREPMF/2022 restent à vérifier ;
- la source officielle et la version actuelle de l’Instruction n°66/CREPMF/2021 restent à obtenir ;
- les rôles de validation, la stack, les environnements et les procédures de production restent à définir ;
- aucune clause n’est `APPROVED` ou `ACTIVE`.

### Questions ouvertes

Les questions `OQ-001` à `OQ-009` restent ouvertes dans `OPEN_QUESTIONS.md`, notamment les responsables, les sources réglementaires officielles, les choix techniques, les commandes de contrôle, les politiques opérationnelles et les modules conditionnels.

### Prochaine étape

Exécuter l’action unique de `NEXT_ACTION.md` dans une nouvelle boucle : obtenir une copie officielle, vérifiable et exploitable de l’Instruction n°66/CREPMF/2021, confirmer sa version et son état juridique, puis préparer son atomisation sans modifier les identifiants existants de la Circulaire n°05/CREPMF/2022.

<!-- AUTO:LOOP-DEV-001-COVERAGE:START -->
## 2026-08-05 — Réconciliation complète de la couverture CIRC005

### Objectif

Réduire les 15 exigences manquantes du cas United Capital Diamond sans inventer de données ni utiliser artificiellement `NOT_APPLICABLE`.

### Travail réalisé

- extension de couverture `0.2.0` ;
- concordance recalculée ;
- statuts `PENDING_REVIEW` explicites ;
- séparation des frais supportés par le porteur ;
- génération déterministe ;
- nouveaux tests de non-régression.

### Résultat

- exigences analysées : `62` ;
- composants documentaires : `44` ;
- couvertes dans le prospectus : `40` ;
- en attente de revue : `20` ;
- manquantes : `0` ;
- non applicables : `1` ;
- métadonnées système : `1` ;
- avertissements : `7` ;
- blocages : `0` ;
- prêt pour revue conformité : `false` ;
- prêt pour soumission : `false`.

### Limite

Le résultat est une pré-conformité technique qui exige toujours les validations juridique, conformité et fiscale.
<!-- AUTO:LOOP-DEV-001-COVERAGE:END -->

<!-- AUTO:LOOP-DEV-001-DOCX:START -->
## 2026-08-05 — Première génération DOCX déterministe

### Objectif

Transformer le modèle documentaire traçable en fichier DOCX de pré-conformité, sans perdre les identifiants, les exigences, les clauses ni les statuts de revue.

### Résultat

- DOCX : `prospectus-draft.docx` ;
- taille : `13208` octets ;
- empreinte SHA-256 : `673b075cbe8cb31fb9418bc7157af7bbed1f882c53e41627f4d61910f523aa95` ;
- composants tracés : `44` ;
- lignes de traçabilité : `44` ;
- tableaux OOXML : `9` ;
- pages rendues pour contrôle visuel : `10` ;
- statut : `DRAFT_PRE_COMPLIANCE_REVIEW` ;
- prêt pour soumission : `false`.

### Contrôles

- paquet OOXML structurellement validé ;
- avertissements obligatoires présents ;
- soumission explicitement interdite ;
- rendu PDF/PNG produit pour inspection visuelle ;
- données sources et concordance inchangées.
<!-- AUTO:LOOP-DEV-001-DOCX:END -->

<!-- AUTO:LOOP-DEV-001-DOCX-VISUAL-QA:START -->
## Inspection visuelle DOCX clôturée — 2026-08-05

- pages rendues et inspectées : `10/10` ;
- première anomalie : puces de risques invisibles — `CORRECTED` ;
- seconde anomalie : ligne de traçabilité fractionnée entre pages — `CORRECTED` ;
- seconde inspection complète : `PASS` ;
- limitation déclarée : densité élevée de l’annexe technique, sans texte coupé ni ligne fractionnée ;
- rapport : `docs/05-quality/DOCX_VISUAL_INSPECTION_2026-08-05.md` ;
- nature du verdict : qualité structurelle et visuelle d’un document de pré-conformité, non validation juridique ou réglementaire.
<!-- AUTO:LOOP-DEV-001-DOCX-VISUAL-QA:END -->

<!-- AUTO:LOOP-DEV-001-NEXTJS-ATOMIC-DESIGN:START -->
## 2026-08-17 — Réconciliation applicative Next.js

### Capacités consolidées

- App Router et TypeScript strict ;
- Atomic Design ;
- questionnaire réglementaire structuré ;
- stockage JSON local versionné ;
- PostgreSQL transactionnel et RLS multi-tenant ;
- identité OIDC côté serveur derrière configuration réelle ;
- RBAC et séparation des tâches ;
- workflow de revue humaine ;
- génération déterministe DOCX et PDF ;
- package ZIP de revue ;
- API de téléchargement d'artefacts avec vérification SHA-256 ;
- import sécurisé en statut `EXTRACTED_UNVERIFIED` ;
- historique de versions local/PostgreSQL et diff read-only ;
- gates de soumission maintenus fermés.

### Frontières maintenues

Aucun déploiement de production, aucune identité fictive, aucun secret inventé, aucune approbation juridique simulée et aucune activation automatique de clause réglementaire. `ready_for_submission` reste `false`.
<!-- AUTO:LOOP-DEV-001-NEXTJS-ATOMIC-DESIGN:END -->

<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:START -->
## 2026-08-05 — Compositeur documentaire générique connecté à Next.js

### Objectif

Transformer chaque projet créé dans l’interface en livrables documentaires traçables sans recopier les règles réglementaires et sans logique réservée à un fonds d’exemple.

### Résultat

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

### Limites restantes

Certains types de questions réglementaires utilisent encore une saisie générique et les chemins contenant `[]` sont conservés dans une zone répétable provisoire. L’Instruction n°66/2021 n’est pas entièrement atomisée. Aucun livrable n’est déclaré conforme, approuvé ou prêt pour soumission.
<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:START -->
## 2026-08-05 — Première collection canonique éditable

La gestion des classes de parts est désormais complète de l’interface au document généré. La question CIRC005 conserve son identifiant et sa traçabilité, mais son composant d’interface est maintenant adapté à la structure réelle des données.

- composant dédié : `SHARE_CLASS_COLLECTION` ;
- question canonique conservée : `Q_SHARE_CLASSES_COUNT` ;
- exigence conservée : `CIRC005_1_10_FCP_PARTS_CHARACTERISTICS` ;
- validation ligne par ligne et unicité des identifiants : `PASS` ;
- migration non destructive des anciennes valeurs booléennes : `IMPLEMENTED` ;
- écriture directe dans `canonicalData.share_classes[]` : `PASS` ;
- stockage provisoire dans `_repeating.share_classes` : `REMOVED` ;
- génération par le compositeur historique et DOCX déterministe : `PASS` ;
- `ready_for_submission` : `false`.

Aucune conclusion de conformité ou de préparation à la soumission n’en découle.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:START -->
## 2026-08-05 — Collections canoniques V1 terminées

Le questionnaire n’utilise plus de champs texte génériques pour les principales données répétables. Les identifiants CIRC005 sont conservés ; la structure de saisie et le modèle canonique deviennent assez précis pour alimenter le moteur documentaire.

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

Cette complétude technique ne constitue pas une validation juridique, conformité, fiscale ou réglementaire.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:END -->

<!-- AUTO:LOOP-DEV-001-CANONICAL-SCHEMA-POSTGRES-V1:START -->
## 2026-08-05 — Baseline de persistance V1

Le projet dispose maintenant d’un contrat JSON, d’un dictionnaire et d’un schéma PostgreSQL testable. Les routes et pages passent par une interface de persistance afin d’éviter de coupler le domaine au stockage JSON local.

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

Aucune base de production, authentification ou certification de sécurité n’est déclarée.
<!-- AUTO:LOOP-DEV-001-CANONICAL-SCHEMA-POSTGRES-V1:END -->

<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:START -->
## 2026-08-17 — Import prospectus : staging transactionnel

Le service d’extraction `EXTRACTED_UNVERIFIED` dispose désormais d’un staging PostgreSQL auditable. Les propositions et décisions humaines peuvent être persistées sans contourner le modèle canonique.

- migration : `database/migrations/0006_import_staging.sql` ;
- staging PostgreSQL tenant-scopé : `IMPLEMENTED_AND_TESTED` ;
- preuve source CLEAN exigée : `PASS` ;
- liaison projet/version/preuve/SHA : `PASS` ;
- RLS tenant : `PASS` ;
- réutilisation cross-tenant d’une preuve : `REJECTED` ;
- revue humaine persistée avec identité : `PASS` ;
- seconde décision sur une valeur revue : `REJECTED` ;
- source extraite après staging : `IMMUTABLE` ;
- `canonical_write_allowed` : `false` verrouillé en base ;
- `ready_for_submission` : `false` verrouillé en base.

La prochaine évolution doit conserver la séparation : extraction → staging → revue humaine → éventuelle commande explicite de copie vers une réponse projet.
<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:END -->

<!-- AUTO:LOOP-GOV-002-GOVERNANCE-RECONCILIATION:START -->
## 2026-08-13 — Gouvernance mono-branche et réparation sans régression

La méthode de travail du dépôt est consolidée : `main` est la branche canonique, les agents ne créent aucune branche, la mémoire persistante reste souveraine et chaque document pertinent est lu/intégré selon son rôle. Aucun Markdown historique n’a été supprimé pour cette consolidation.

Une défaillance CI antérieure au chantier a été traitée selon la boucle `BASELINE → DIAGNOSTIC → CORRECTION CIBLÉE → VÉRIFICATION`. La compatibilité descendante des structures historiques a été conservée, tandis que le déterminisme PDF a été renforcé par la normalisation du seul champ volatile prouvé `/DocChecksum`.

- branche canonique : `main` ;
- HEAD source vérifié par la boucle : `66dac285498f868cf38c1bfb8efa0525f033af21` ;
- date du HEAD source : `2026-08-17` ;
- run Regulatory CI : `32061607838` ;
- validation API CIRC005 : `PASS` ;
- compatibilité descendante des 10 collections structurées : `PASS` ;
- persistance canonique des anciens payloads : `PASS` ;
- reproductibilité PDF après normalisation fixe des métadonnées LibreOffice, dont `/DocChecksum` : `PASS` ;
- dépôt PostgreSQL transactionnel : `PASS` ;
- `ready_for_submission` : `false` ;
- dépendances externes Instruction 66 : `49` occurrences, `33` résolues documentairement, `16` non résolues ;
- circulaires : `34` total, `25` résolues, `9` non résolues ;
- instructions génériques : `7` total, `5` résolues, `2` non résolues ;
- activation réglementaire automatique : `FORBIDDEN` ;
- revues juridique et conformité : `PENDING`.

`LOOP-GOV-002` est clôturée. Le point de reprise exact est l’acquisition du binaire institutionnel `CM/10/06/2022`, sans activation automatique d’une règle ou sanction.
<!-- AUTO:LOOP-GOV-002-GOVERNANCE-RECONCILIATION:END -->
