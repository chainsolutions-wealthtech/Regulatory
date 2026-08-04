# TODO.md

Feuille de route opérationnelle du projet `Regulatory`.

Légende :

- `[x]` terminé et documenté ;
- `[~]` en cours ;
- `[ ]` à faire ;
- `[!]` bloqué, incertain ou nécessitant une validation.

> **Entrée attendue du propriétaire :** un prompt complet doit encore être transmis pour créer et organiser l’ensemble des fichiers `.md`. Jusqu’à sa réception et son analyse, ne pas effectuer de refonte globale de la taxonomie documentaire et ne pas supprimer, fusionner ou renommer les documents existants.

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
- [~] Attendre, analyser puis intégrer le prompt complet d’organisation des fichiers `.md` annoncé par le propriétaire.
- [ ] Définir les responsables métier, conformité, juridique, fiscal, technique et sécurité.
- [ ] Définir le processus formel d’approbation des clauses.
- [ ] Définir les environnements de développement, test, recette et production.

## Phase 1 — Corpus réglementaire source

- [x] Enregistrer la Circulaire n°05/CREPMF/2022 comme source structurante dans un registre machine-readable.
- [~] Enregistrer l’Instruction n°66/CREPMF/2021 comme source structurante.
- [~] Archiver les copies officielles autorisées des textes : métadonnées et empreinte de la circulaire enregistrées ; binaire à archiver ultérieurement.
- [~] Enregistrer pour chaque texte : titre, numéro, date, date d’effet, statut, source officielle et empreinte.
- [ ] Vérifier l’existence de versions modifiées, rectificatifs ou textes d’abrogation.
- [ ] Inventorier les circulaires, instructions et décisions complémentaires relatives aux OPC.
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
- [~] Définir la sévérité des contrôles.
- [~] Définir les preuves attendues.
- [~] Définir les rôles de revue.
- [~] Définir les dépendances entre exigences.
- [x] Créer une validation structurelle de complétude du mapping de la circulaire.
- [ ] Atomiser intégralement l’Instruction n°66/CREPMF/2021.
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

1. Recevoir et intégrer le prompt complet d’organisation des fichiers `.md`, sans régression ni suppression de l’historique documentaire.
2. Obtenir et atomiser une copie vérifiable de l’Instruction n°66/CREPMF/2021.
3. Compléter le modèle canonique champ par champ.
4. Transformer la matrice de la Circulaire 05/2022 en catalogues exécutables de questions, options, règles et groupes de clauses.
5. Construire le premier cas de test FCP obligataire standard.
