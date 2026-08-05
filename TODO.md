# TODO.md

Feuille de route opérationnelle du projet `Regulatory`.

Légende :

- `[x]` terminé et documenté ;
- `[~]` en cours ;
- `[ ]` à faire ;
- `[!]` bloqué, incertain ou nécessitant une validation.

> **Mise à jour du 2026-08-05 :** `LOOP-GOV-001` est clôturée. `LOOP-REG-001` est ouverte pour enregistrer, contrôler et préparer l’atomisation de l’Instruction n°66/CREPMF/2021. Le registre officiel AMF-UMOA la liste `NON ABROGE`; la publication BRVM et le PDF de 65 pages sont identifiés. L’empreinte binaire, les dates exactes et l’inventaire des versions restent en cours.

---

## Phase 0 — Gouvernance et mémoire du projet

- [x] Initialiser le dépôt.
- [x] Documenter la vision et le périmètre V1.
- [x] Ajouter la règle interdisant la création automatique de nouvelles branches.
- [x] Ajouter le protocole de lecture obligatoire avant modification.
- [x] Ajouter les règles de non-régression.
- [x] Créer `SUIVI.md`.
- [x] Créer `TODO.md`.
- [x] Créer `docs/DECISIONS.md`.
- [x] Créer `docs/ARCHITECTURE.md`.
- [x] Créer `docs/PROSPECTUS_ENGINE_SPEC.md`.
- [x] Créer `docs/REGULATORY_MAPPING.md`.
- [x] Recevoir, analyser puis intégrer le prompt complet d’organisation des fichiers `.md` annoncé par le propriétaire.
- [x] `TASK-GOV-001` — Intégrer le standard documentaire Loop Engineering sans régression.
- [x] Créer `00_START_HERE.md`, `SOURCE_OF_TRUTH.md` et la hiérarchie canonique des documents.
- [x] Créer les registres d’état, de boucle, de reprise, de journal et de prochaine action.
- [x] Créer les sept ADR de gouvernance `ADR-0001` à `ADR-0007`.
- [x] Vérifier la présence des `176` chemins Markdown du kit et la préservation des artefacts existants.
- [x] Ouvrir `LOOP-REG-001` sans créer ni changer de branche.
- [ ] Définir les responsables métier, conformité, juridique, fiscal, technique et sécurité.
- [ ] Définir le processus formel d’approbation des clauses.
- [ ] Définir les environnements de développement, test, recette et production.

## Phase 1 — Corpus réglementaire source

- [x] Enregistrer la Circulaire n°05/CREPMF/2022 comme source structurante dans un registre machine-readable.
- [x] Enregistrer l’Instruction n°66/CREPMF/2021 comme source structurante.
- [x] Enregistrer l’URL du registre officiel AMF-UMOA et son statut `NON ABROGE` au 2026-08-05.
- [x] Enregistrer la publication BRVM du 12 janvier 2022 et l’URL du PDF de 65 pages.
- [~] Matérialiser une copie exploitable du PDF et calculer sa taille et son SHA-256.
- [~] Enregistrer pour l’Instruction 66 : date de signature, date d’effet, prédécesseur, modificatifs et rectificatifs.
- [~] Archiver les copies officielles autorisées des textes : empreinte de la circulaire enregistrée ; copie binaire de l’Instruction 66 à contrôler.
- [~] Vérifier l’existence de versions modifiées, rectificatifs ou textes d’abrogation.
- [~] Inventorier les circulaires, instructions et décisions complémentaires relatives aux OPC à partir des registres AMF-UMOA.
- [ ] Identifier les textes relatifs à la classification des OPC.
- [ ] Identifier les textes relatifs aux ratios d’investissement.
- [ ] Identifier les textes relatifs à la valorisation.
- [ ] Identifier les textes relatifs aux outils de gestion de liquidité.
- [ ] Identifier les textes relatifs aux frais, commissions et rémunérations.
- [ ] Identifier les textes relatifs au DICI.
- [ ] Identifier les textes relatifs à la commercialisation dans les États membres.
- [ ] Identifier les textes fiscaux nationaux pertinents pour chaque État.
- [!] Faire valider le corpus minimal par un juriste ou responsable conformité UMOA.

## Phase 2 — Atomisation des exigences réglementaires

- [x] Créer la première cartographie des points 1.1 à 5.4 de la Circulaire n°05/CREPMF/2022.
- [x] Produire un index machine-readable de 62 exigences V1 liées au parcours FCP/SGO.
- [x] Définir un identifiant stable pour chaque exigence V1 de la circulaire.
- [x] Définir l’ordre réglementaire de chaque exigence V1 de la circulaire.
- [x] Définir les premières conditions d’applicabilité de la circulaire.
- [x] Définir les produits concernés dans le périmètre V1 : FCP et SGO, avec acteurs associés.
- [x] Définir les modes de couverture admis : prospectus, règlement, annexe, non applicable.
- [x] Créer `INSTRUCTION_66_ATOMIZATION_PLAN_V0_1.yaml`.
- [~] Définir la sévérité des contrôles.
- [~] Définir les preuves attendues.
- [~] Définir les rôles de revue.
- [~] Définir les dépendances entre exigences.
- [x] Créer une validation structurelle de complétude du mapping de la circulaire.
- [ ] Produire `INST066_ARTICLE_INDEX_V0_1.yaml` avec titres, chapitres, sections, articles et pages.
- [ ] Atomiser intégralement l’Instruction n°66/CREPMF/2021 avec des identifiants `INST066_*`.
- [ ] Créer le crosswalk `INST066 ↔ CIRC005 ↔ modèle canonique`.
- [!] Faire valider l’interprétation des exigences par la conformité et le juridique.

## Phase 3 — Modèle canonique

- [~] Créer l’architecture canonique V0.1 et inventorier les objets principaux.
- [~] Définir l’objet `RegulatoryContext`.
- [~] Définir l’objet `Fund`.
- [~] Définir l’objet `ShareClass`.
- [~] Définir l’objet `ManagementCompany`.
- [~] Définir l’objet `Depositary`.
- [~] Définir l’objet `Auditor`.
- [~] Définir l’objet `AccountingControlPerson`.
- [~] Définir l’objet `ExternalAdviser`.
- [~] Définir l’objet `Distributor`.
- [~] Définir l’objet `PayingAgent`.
- [~] Définir l’objet `InvestmentPolicy`.
- [~] Définir l’objet `AssetExposureRange`.
- [~] Définir l’objet `Benchmark`.
- [~] Définir l’objet `RiskFactor`.
- [~] Définir l’objet `FeeAndExpense`.
- [~] Définir l’objet `ValuationMethod`.
- [~] Définir l’objet `NavRule`.
- [~] Définir l’objet `SubscriptionRule`.
- [~] Définir l’objet `RedemptionRule`.
- [~] Définir l’objet `LiquidityManagementTool`.
- [~] Définir l’objet `DistributionCountryArrangement`.
- [~] Définir l’objet `Evidence`.
- [~] Définir l’objet `RegulatoryCoverage`.
- [~] Définir l’objet `ReviewAndApproval`.
- [~] Définir l’objet `AuditEvent`.
- [ ] Définir chaque champ : description, type, cardinalité, unité, enum, sensibilité, source et validations.
- [ ] Relier les champs canoniques aux champs Openfunds pertinents.
- [ ] Définir les migrations et la politique de compatibilité.
- [ ] Produire JSON Schema, schéma SQL et dictionnaire de données.

## Phase 4 — Référentiels statiques

- [ ] Créer le référentiel des États membres de l’UMOA.
- [ ] Créer le référentiel des devises et calendriers.
- [ ] Créer le référentiel des sociétés de gestion agréées.
- [ ] Créer le référentiel des autres OPC gérés par chaque SGO.
- [ ] Créer le référentiel des dépositaires.
- [ ] Créer le référentiel des commissaires aux comptes.
- [ ] Créer le référentiel des conseillers externes.
- [ ] Créer le référentiel des distributeurs.
- [ ] Créer le référentiel des agents payeurs.
- [ ] Créer le référentiel des classifications de fonds.
- [ ] Créer le référentiel des catégories d’actifs.
- [ ] Créer le référentiel des risques.
- [ ] Créer le référentiel des frais.
- [ ] Créer le référentiel des méthodes de valorisation.
- [ ] Définir les sources et fréquences de mise à jour.
- [ ] Définir les règles de validation et de dédoublonnage.
- [ ] Définir la gestion des données historiques et des changements d’identité.

## Phase 5 — Catalogue maître des questions

- [~] Créer une première matrice reliant les 62 exigences V1 à des questions, effets, clauses, contrôles et preuves.
- [~] Définir les groupes de questions.
- [~] Définir les questions d’aiguillage.
- [~] Définir les questions d’identité du fonds.
- [~] Définir les questions sur les parts et classes.
- [~] Définir les questions sur les acteurs.
- [~] Définir les questions sur l’objectif et la stratégie.
- [~] Définir les questions sur les actifs et fourchettes.
- [~] Définir les questions sur les risques.
- [~] Définir les questions sur la VL.
- [~] Définir les questions sur la souscription et le rachat.
- [~] Définir les questions sur les suspensions et gates.
- [~] Définir les questions sur les frais.
- [~] Définir les questions sur la valorisation.
- [~] Définir les questions sur la fiscalité.
- [~] Définir les questions sur la commercialisation multi-États.
- [~] Définir les questions sur les performances.
- [~] Définir les questions sur les preuves.
- [~] Associer chaque question à ses champs, exigences, effets et contrôles.
- [ ] Transformer les lignes de matrice en catalogue exécutable versionné.
- [ ] Tester toutes les branches du graphe.

## Phase 6 — Bibliothèque de clauses juridiques

- [ ] Définir le schéma d’une clause au niveau implémentable.
- [ ] Définir les catégories de clauses.
- [ ] Créer les clauses de couverture et avertissement.
- [ ] Créer les clauses d’identité du FCP.
- [ ] Créer les clauses relatives à la société de gestion.
- [ ] Créer les clauses relatives au dépositaire.
- [ ] Créer les clauses relatives aux conseillers externes.
- [ ] Créer les clauses relatives aux parts.
- [ ] Créer les clauses relatives aux revenus.
- [ ] Créer les clauses d’objectif et stratégie.
- [ ] Créer les clauses de risques.
- [ ] Créer les clauses de VL et publication.
- [ ] Créer les clauses de souscription et rachat.
- [ ] Créer les clauses de suspension et gestion de liquidité.
- [ ] Créer les clauses de frais.
- [ ] Créer les clauses de valorisation.
- [ ] Créer les clauses de fiscalité par pays.
- [ ] Créer les clauses de commercialisation par État.
- [ ] Créer les clauses de performance.
- [ ] Créer le workflow d’approbation des clauses.
- [!] Obtenir la validation juridique des clauses avant activation.

## Phase 7 — Moteur de règles et conformité configurée

- [ ] Définir le format des règles.
- [ ] Implémenter les validations de forme.
- [ ] Implémenter les validations métier.
- [ ] Implémenter les validations réglementaires.
- [ ] Implémenter les contrôles interdocumentaires.
- [ ] Implémenter les contrôles de fourchettes d’actifs.
- [ ] Implémenter les contrôles de frais.
- [ ] Implémenter les contrôles des risques.
- [ ] Implémenter les contrôles de méthodes de valorisation.
- [ ] Implémenter les contrôles multi-États.
- [ ] Implémenter la gestion de `NOT_APPLICABLE` avec justification.
- [ ] Implémenter les niveaux `INFO`, `WARNING`, `BLOCKER`.
- [ ] Créer les rapports de contrôle.
- [ ] Créer les tests de non-régression réglementaire.

## Phase 8 — Moteur de composition documentaire

- [ ] Définir les composants documentaires.
- [ ] Définir l’ordre réglementaire.
- [ ] Créer le modèle de couverture.
- [ ] Créer le sommaire automatique.
- [ ] Créer les sections 1 à 5 de la circulaire.
- [ ] Créer les tableaux de synthèse des parts.
- [ ] Créer les tableaux d’actifs et limites.
- [ ] Créer les tableaux de frais.
- [ ] Créer les annexes pays.
- [ ] Créer la table de concordance.
- [ ] Créer le rapport de complétude.
- [ ] Créer le rapport de contrôles.
- [ ] Créer le journal des modifications.
- [ ] Générer DOCX.
- [ ] Générer PDF.
- [ ] Générer JSON canonique.
- [ ] Garantir un rendu déterministe.
- [ ] Conserver la provenance de chaque composant.

## Phase 9 — Interface utilisateur

- [ ] Créer le tableau de bord.
- [ ] Créer le profil permanent de la société de gestion.
- [ ] Créer le parcours nouveau prospectus.
- [ ] Créer le parcours mise à jour.
- [ ] Créer le parcours import d’un ancien prospectus.
- [ ] Créer le parcours duplication d’un fonds.
- [ ] Créer le questionnaire progressif.
- [ ] Créer la prévisualisation en temps réel.
- [ ] Afficher la complétude.
- [ ] Afficher les blocages et avertissements.
- [ ] Créer l’assignation des questions.
- [ ] Créer les commentaires et demandes de correction.
- [ ] Créer les écrans de revue conformité et juridique.
- [ ] Créer l’export du dossier de soumission.
- [ ] Tester accessibilité, responsive et ergonomie.

## Phase 10 — Import et extraction documentaire

- [ ] Importer un prospectus existant.
- [ ] Extraire les sections et données.
- [ ] Associer les données extraites aux champs canoniques.
- [ ] Conserver les coordonnées de provenance.
- [ ] Comparer avec les référentiels.
- [ ] Demander confirmation des données incertaines.
- [ ] Identifier les informations manquantes.
- [ ] Comparer deux versions.
- [ ] Tester sur plusieurs prospectus agréés.

## Phase 11 — Workflow, sécurité et audit

- [ ] Définir les rôles et permissions.
- [ ] Définir la séparation des tâches.
- [ ] Implémenter les approbations.
- [ ] Implémenter le gel de version.
- [ ] Implémenter les signatures ou attestations internes.
- [ ] Implémenter le journal d’audit.
- [ ] Définir la rétention documentaire.
- [ ] Chiffrer les données sensibles.
- [ ] Mettre en place la gestion des secrets.
- [ ] Réaliser l’analyse de sécurité.
- [ ] Réaliser l’analyse de protection des données.

## Phase 12 — Recette réglementaire et cas de test

- [ ] Sélectionner un corpus de prospectus agréés.
- [ ] Construire les jeux de données attendus.
- [ ] Reproduire un FCP obligataire standard.
- [ ] Reproduire un FCP monétaire.
- [ ] Reproduire un FCP actions.
- [ ] Reproduire un FCP diversifié.
- [ ] Tester un fonds avec plusieurs classes.
- [ ] Tester une commercialisation multi-États.
- [ ] Tester un fonds avec conseiller externe.
- [ ] Tester un fonds avec outils de liquidité.
- [ ] Tester un fonds sans historique.
- [ ] Tester une mise à jour réglementaire.
- [ ] Faire relire les résultats par la conformité et le juridique.
- [!] Obtenir une validation formelle avant usage en production.

## Priorité immédiate

1. Matérialiser et empreinter le PDF de l’Instruction n°66/CREPMF/2021.
2. Produire l’index complet des titres, chapitres, sections et articles avec coordonnées de page.
3. Identifier le prédécesseur, les modificatifs, rectificatifs et textes connexes.
4. Atomiser l’Instruction avec des identifiants `INST066_*` et créer le crosswalk avec `CIRC005`.
5. Compléter le modèle canonique champ par champ.
6. Transformer la matrice de la Circulaire 05/2022 en catalogues exécutables.
7. Construire le premier cas de test FCP obligataire standard.

<!-- AUTO:LOOP-DEV-001-COVERAGE:START -->
## Mise à jour opérationnelle — LOOP-DEV-001 V0.2

- [x] Identifier les 15 exigences CIRC005 manquantes.
- [x] Ramener `MISSING` à zéro sans faux `NOT_APPLICABLE`.
- [x] Ajouter les statuts `PENDING_REVIEW` au manifeste.
- [x] Séparer les dépenses directement supportées par le porteur.
- [x] Ajouter les tests de non-régression de couverture.
- [x] Rendre la génération du cas d’exemple déterministe.
- [ ] Confirmer les `20` exigences en attente de revue.
- [ ] Produire un export DOCX déterministe de pré-conformité.
- [ ] Reprendre `LOOP-REG-001` et l’atomisation de l’Instruction n°66/2021.
- [ ] Obtenir les validations juridique, conformité et fiscale.
<!-- AUTO:LOOP-DEV-001-COVERAGE:END -->

<!-- AUTO:LOOP-DEV-001-DOCX:START -->
## Mise à jour opérationnelle — DOCX V0.1

- [x] Générer le DOCX depuis le modèle documentaire.
- [x] Conserver la traçabilité dans le DOCX.
- [x] Ajouter les styles, tableaux et avertissements.
- [x] Ajouter un validateur OOXML.
- [x] Produire un rendu PDF/PNG de contrôle dans la CI.
- [ ] Examiner visuellement toutes les pages et corriger les défauts détectés.
- [ ] Créer l’API locale du questionnaire dynamique.
- [ ] Créer la première interface web progressive.
- [ ] Ajouter la persistance versionnée des projets et réponses.
- [ ] Reprendre l’Instruction n°66/2021.
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
## Mise à jour opérationnelle — Next.js / Atomic Design

- [x] Créer l’application Next.js App Router.
- [x] Structurer les composants selon Atomic Design.
- [x] Créer le tableau de bord et les projets.
- [x] Créer le questionnaire en 18 groupes.
- [x] Ajouter la persistance locale versionnée et l’audit.
- [x] Ajouter les Route Handlers projets, questions, réponses et génération.
- [x] Ajouter les contrôles et l’aperçu.
- [x] Ajouter le typecheck et le build Next.js à la CI.
- [ ] Générer le catalogue web directement depuis les matrices réglementaires.
- [ ] Généraliser le moteur documentaire à tous les projets.
- [ ] Brancher l’export DOCX sur les projets créés dans l’interface.
- [ ] Ajouter les tests d’intégration des API.
- [ ] Ajouter PostgreSQL et les migrations.
- [ ] Ajouter authentification, RBAC et séparation tenant.
- [ ] Effectuer la recette navigateur desktop et mobile.
- [ ] Reprendre l’atomisation de l’Instruction n°66/2021.
<!-- AUTO:LOOP-DEV-001-NEXTJS-ATOMIC-DESIGN:END -->

<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:START -->
## Mise à jour opérationnelle — génération documentaire web

- [x] Générer le catalogue web depuis les quatre matrices CIRC005.
- [x] Vérifier l’égalité exacte avec les 62 exigences du registre YAML.
- [x] Isoler les questions applicatives sous des identifiants `APP_*`.
- [x] Préserver et signaler les réponses historiques non mappées.
- [x] Générer un snapshot canonique versionné par projet.
- [x] Faire consommer le snapshot canonique par le compositeur documentaire historique.
- [x] Générer Markdown, concordance, contrôles et DOCX pour chaque projet web.
- [x] Persister le bundle complet dans le dossier versionné de génération.
- [x] Ajouter les tests unitaires et HTTP de bout en bout.
- [ ] Remplacer les saisies répétables provisoires par des composants dédiés et typés.
- [ ] Écrire les tableaux structurés directement dans les collections canoniques attendues par le compositeur.
- [ ] Ajouter une inspection visuelle automatisée du DOCX généré depuis un projet web générique.
- [ ] Reprendre l’atomisation de l’Instruction n°66/2021.
- [ ] Ajouter PostgreSQL, authentification, RBAC et séparation tenant avant tout déploiement.
<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:START -->
## Collections structurées — état détaillé

- [x] Créer le type `SHARE_CLASS_COLLECTION`.
- [x] Créer l’éditeur réutilisable des classes de parts.
- [x] Valider chaque classe avant persistance.
- [x] Garantir des identifiants de classe stables et uniques.
- [x] Migrer les anciennes réponses booléennes sans perte.
- [x] Alimenter directement `share_classes[]`.
- [x] Tester le flux questionnaire → snapshot → compositeur → DOCX.
- [ ] Structurer les fourchettes d’allocation par classe d’actifs.
- [ ] Structurer les commissions et frais.
- [ ] Structurer les méthodes de valorisation.
- [ ] Structurer les intervenants et la gouvernance.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:END -->
