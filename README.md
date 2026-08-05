# Regulatory — UMOA Prospectus Composer

Plateforme de connaissance réglementaire et de génération assistée de prospectus pour les organismes de placement collectif de l’UMOA.

> **État du projet : cadrage fonctionnel et réglementaire initial.** Le premier périmètre retenu est la création et la mise à jour de prospectus de **Fonds Communs de Placement (FCP) / OPCVM relevant de l’AMF-UMOA**. Aucun document généré par le futur système ne devra être présenté comme agréé, approuvé ou visé avant la décision formelle de l’autorité compétente.

## 1. Vision

L’objectif n’est pas de demander à une société de gestion de rédiger elle-même un prospectus. La société de gestion doit uniquement :

1. confirmer ses informations institutionnelles déjà connues ;
2. décrire les caractéristiques propres du fonds ;
3. répondre à des questions simples, principalement à choix multiples ;
4. fournir les pièces justificatives manquantes ;
5. corriger les éventuelles incohérences signalées ;
6. faire valider le résultat par les fonctions conformité, juridique et direction.

La plateforme doit ensuite :

- déterminer le parcours réglementaire applicable ;
- poser uniquement les questions utiles ;
- sélectionner les formulations juridiques validées ;
- composer les paragraphes, tableaux, avertissements et annexes ;
- contrôler la complétude, la cohérence et la conformité configurée ;
- produire le prospectus complet, sa table de concordance, son rapport de contrôle et son dossier de preuves.

Le principe directeur est :

```text
La société décrit le fonds.
La plateforme connaît les règles, choisit les questions,
sélectionne les clauses et construit le prospectus.
```

## 2. Périmètre fonctionnel V1

### Inclus

- juridiction : UMOA ;
- autorité : AMF-UMOA, anciennement CREPMF ;
- produit : OPCVM ;
- forme prioritaire : FCP ;
- documents : prospectus initial et mise à jour d’un prospectus existant ;
- catégories initiales : monétaire, obligataire, actions, diversifié et fonds de fonds ;
- sociétés de gestion, dépositaires, commissaires aux comptes, conseillers externes et distributeurs ;
- classes de parts ;
- politique d’investissement ;
- risques ;
- valeur liquidative ;
- souscriptions, rachats et outils de liquidité ;
- frais ;
- méthodes de valorisation ;
- fiscalité ;
- commercialisation dans un ou plusieurs États membres ;
- génération DOCX, PDF, JSON canonique, table de concordance et rapport de contrôle.

### Extensions prévues

- SICAV ;
- fonds indiciels et ETF ;
- fonds à formule ;
- fonds garantis ou protégés ;
- dérivés complexes ;
- classes couvertes contre le risque de change ;
- restructurations, fusions, changements de société de gestion et liquidations ;
- DICI, règlement du fonds, bulletins de souscription et de rachat ;
- autres juridictions africaines ;
- packs France et Union européenne séparés.

## 3. Fondements réglementaires initiaux

Le moteur réglementaire V1 doit être construit au minimum à partir des textes et documents suivants :

- Instruction n°66/CREPMF/2021 relative aux organismes de placement collectif et à leurs sociétés de gestion sur le marché financier régional de l’UMOA ;
- Circulaire n°05/CREPMF/2022 relative au contenu du prospectus des OPC ;
- règlements des OPC et documents constitutifs annexés ;
- textes complémentaires relatifs à la classification, aux ratios, à la valorisation, à la commercialisation, aux outils de liquidité et aux obligations d’information ;
- prospectus agréés utilisés uniquement comme cas d’étude et cas de test, jamais comme substituts aux textes applicables.

La Circulaire n°05/CREPMF/2022 impose notamment :

- des renseignements minimaux ;
- un ordre de présentation ;
- la possibilité que certaines informations soient couvertes par le règlement de l’OPC ou par des documents constitutifs annexés ;
- des informations relatives au FCP, à la société de gestion, au dépositaire, aux conseillers externes, aux paiements et rachats par État, aux performances, à l’investisseur-type et aux dépenses.

Chaque exigence devra être atomisée, versionnée et reliée à une source réglementaire précise. Le système ne devra jamais inventer une obligation ni considérer un champ comme conforme sur la seule base d’une formulation plausible.

## 4. Architecture fonctionnelle cible

Le produit repose sur trois moteurs principaux :

```text
LEGAL KNOWLEDGE BASE
Textes + versions + exigences + clauses + preuves attendues

DECISION & QUESTION ENGINE
Questions + choix + conditions + effets + validations

DOCUMENT COMPOSER
Sections + paragraphes + tableaux + annexes + exports
```

Ils sont complétés par :

- un modèle canonique de données ;
- un moteur de contrôles réglementaires ;
- un moteur de cohérence interdocumentaire ;
- un service de gestion des preuves ;
- un workflow de revue et d’approbation ;
- un journal d’audit immuable ;
- un moteur de versionnement et d’impact réglementaire.

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 5. Données à précharger

La plateforme doit contenir avant le démarrage d’un questionnaire :

- le référentiel des juridictions, pays, autorités, devises et calendriers ;
- le référentiel des sociétés de gestion et de leurs agréments ;
- les sièges statutaires et administrations centrales ;
- les dirigeants, administrateurs et organes de surveillance ;
- les capitaux souscrits et libérés ;
- les autres OPC gérés ;
- les dépositaires et leurs fonctions ;
- les commissaires aux comptes ;
- les conseillers externes ;
- les distributeurs et agents payeurs ;
- les classifications de fonds ;
- les catégories d’actifs ;
- les risques ;
- les types de frais ;
- les méthodes de valorisation ;
- les clauses juridiques versionnées ;
- les règles de validation ;
- les documents justificatifs déjà vérifiés.

Une donnée canonique ne doit être saisie qu’une fois et doit alimenter tous les documents et écrans concernés.

## 6. Questionnaire dynamique

Le questionnaire ne doit pas être une liste fixe de centaines de champs. Il doit être un graphe de décision.

Une réponse peut :

- afficher ou masquer d’autres questions ;
- préremplir des données ;
- sélectionner une ou plusieurs clauses ;
- proposer des risques ;
- imposer une méthode de valorisation ;
- demander une preuve ;
- déclencher un contrôle ;
- construire une section documentaire ;
- imposer une revue juridique.

Parcours utilisateur V1 :

1. projet et statut réglementaire ;
2. identité et durée du fonds ;
3. parts et classes de parts ;
4. société de gestion ;
5. dépositaire, commissaires aux comptes et autres intervenants ;
6. objectifs et politique d’investissement ;
7. risques et limites ;
8. valeur liquidative, prix, souscriptions et rachats ;
9. revenus, frais et fiscalité ;
10. commercialisation par pays et information des porteurs ;
11. documents, performances et validation finale.

## 7. Bibliothèque de formulations juridiques

La bibliothèque doit distinguer :

1. les mentions réglementaires verrouillées ;
2. les clauses paramétriques validées ;
3. les clauses conditionnelles ;
4. les clauses composées à partir de choix multiples ;
5. les clauses factuelles générées depuis les référentiels ;
6. les rédactions spécifiques soumises à revue juridique.

Chaque clause doit posséder :

- un identifiant stable ;
- une juridiction ;
- un produit ;
- une section ;
- une ou plusieurs exigences réglementaires liées ;
- une version ;
- une date d’effet ;
- un statut de validation ;
- des conditions d’utilisation ;
- des variables autorisées ;
- les rôles ayant approuvé la clause ;
- un historique complet.

Une clause publiée ne doit jamais être modifiée rétroactivement. Toute évolution crée une nouvelle version.

## 8. Couverture réglementaire et table de concordance

Pour chaque exigence, le système doit enregistrer l’un des statuts suivants :

- `IN_PROSPECTUS` ;
- `IN_ATTACHED_REGULATION` ;
- `IN_ATTACHED_CONSTITUTIVE_DOCUMENT` ;
- `NOT_APPLICABLE` avec justification ;
- `PENDING_REVIEW` ;
- `MISSING`.

Le générateur doit produire automatiquement une table de concordance reliant :

- l’exigence ;
- le texte et la version source ;
- la section du prospectus ;
- le règlement annexé ;
- les autres annexes ;
- le statut de contrôle ;
- la preuve ;
- le réviseur.

## 9. Documents produits

À terme, un même objet fonds devra permettre de générer :

- le prospectus DOCX ;
- le prospectus PDF ;
- la table de concordance ;
- le rapport de complétude ;
- le rapport de contrôles ;
- le journal des modifications ;
- le dossier de preuves ;
- le JSON canonique ;
- le DICI ;
- le règlement du fonds ;
- les bulletins de souscription et de rachat ;
- les fiches produit et internet ;
- les exports Openfunds.

## 10. Limites et validation humaine

Le moteur automatise la composition et les contrôles configurés. Il ne remplace pas :

- la décision du régulateur ;
- la qualification juridique d’un cas atypique ;
- la validation fiscale ;
- la validation conformité ;
- la validation des organes compétents de la société de gestion.

Les formulations spécifiques, les produits complexes et les écarts aux modèles approuvés doivent porter le statut `LEGAL_REVIEW_REQUIRED`.

## 11. Règles impératives de travail sur ce dépôt

Ce dépôt suit une politique particulière demandée par le propriétaire du projet.

### 11.1 Aucune création automatique de branche

Toute personne, agent, assistant, automatisation ou outil connecté à ce dépôt doit :

- **ne jamais créer une nouvelle branche automatiquement** ;
- continuer sur la branche existante explicitement désignée ;
- utiliser `main` lorsque aucune autre branche existante n’a été expressément désignée ;
- ne jamais changer de branche sans instruction explicite ;
- ne jamais forcer, réécrire ou supprimer l’historique.

Cette règle ne dispense pas de tests, de revue ni de prudence. Elle interdit uniquement la création spontanée de branches par les agents connectés.

### 11.2 Lecture obligatoire avant modification

Avant toute modification, il faut lire dans cet ordre :

1. `README.md` ;
2. `AGENTS.md` ;
3. `SUIVI.md` ;
4. `TODO.md` ;
5. `docs/DECISIONS.md` ;
6. `docs/ARCHITECTURE.md` ;
7. la spécification concernée ;
8. les fichiers de code et tests concernés ;
9. les derniers commits pertinents.

Il faut ensuite expliquer ce qui existe, ce qui sera modifié, pourquoi, quels contrôles seront réalisés et quels risques de régression ont été identifiés.

### 11.3 Zéro régression

Aucune modification ne doit :

- écraser une décision validée sans la documenter ;
- supprimer une exigence ou une clause sans analyse d’impact ;
- casser un identifiant canonique existant ;
- modifier rétroactivement une clause active ;
- supprimer une preuve ou un lien de traçabilité ;
- introduire une règle sans source ;
- modifier un résultat existant sans test de non-régression ;
- ignorer les travaux précédents.

### 11.4 Documentation continue

Chaque évolution significative doit mettre à jour, dans le même changement :

- le présent `README.md` si la vision, le périmètre ou l’usage changent ;
- `SUIVI.md` pour ce qui vient d’être réalisé et validé ;
- `TODO.md` pour les tâches restantes ;
- `docs/DECISIONS.md` pour toute décision structurante ;
- la documentation d’architecture ou de spécification concernée ;
- les tests ou exemples concernés.

Voir [AGENTS.md](AGENTS.md) et [CONTRIBUTING.md](CONTRIBUTING.md).

## 12. Structure documentaire du dépôt

```text
Regulatory/
├── README.md
├── AGENTS.md
├── CONTRIBUTING.md
├── SUIVI.md
├── TODO.md
├── CHANGELOG.md
├── .github/
│   ├── CODEOWNERS
│   └── copilot-instructions.md
└── docs/
    ├── ARCHITECTURE.md
    ├── DECISIONS.md
    ├── PROSPECTUS_ENGINE_SPEC.md
    └── REGULATORY_MAPPING.md
```

Le code applicatif sera ajouté seulement après validation de l’architecture, du modèle canonique et du corpus réglementaire minimal.

## 13. État actuel

Réalisé :

- périmètre V1 confirmé ;
- analyse fonctionnelle du prospectus FCP United Capital Diamond ;
- intégration conceptuelle de la Circulaire n°05/CREPMF/2022 ;
- définition du principe de données statiques préchargées ;
- définition du questionnaire dynamique ;
- définition de la bibliothèque de wordings juridiques ;
- définition du graphe de décision ;
- définition des moteurs de règles, de composition et de concordance ;
- initialisation de la documentation de gouvernance du dépôt.

Prochaine priorité :

> Constituer le corpus réglementaire source, atomiser chaque exigence et produire la première matrice canonique `exigence → donnée → question → option → effet → clause → contrôle → preuve → section`.

Consulter [SUIVI.md](SUIVI.md) et [TODO.md](TODO.md) avant de commencer tout travail.

## 14. Intégration documentaire Loop Engineering — mise à jour du 2026-08-05

Cette section est postérieure aux sections historiques ci-dessus. Elle les conserve comme mémoire du cadrage initial, mais actualise l’ordre de lecture, l’organisation documentaire et l’état courant.

### 14.1 Point d’entrée obligatoire

Toute intervention commence par [`00_START_HERE.md`](00_START_HERE.md), puis suit l’ordre complet qui y est défini. Cet ordre complète les obligations historiques de la section 11 et de `AGENTS.md` ; il ne les supprime pas.

La hiérarchie d’autorité est définie dans [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md). Les conversations ne constituent jamais la mémoire canonique du projet.

### 14.2 Documents canoniques maintenus

Les documents historiques suivants restent canoniques :

- `README.md` pour la vision et le périmètre général ;
- `AGENTS.md` pour les règles communes des agents ;
- `SUIVI.md` pour l’historique chronologique ;
- `TODO.md` pour le registre opérationnel principal ;
- `docs/DECISIONS.md` pour les décisions historiques ;
- `docs/ARCHITECTURE.md` pour l’architecture ;
- `docs/PROSPECTUS_ENGINE_SPEC.md` pour la spécification fonctionnelle ;
- `docs/REGULATORY_MAPPING.md` et `regulatory/` pour le mapping réglementaire.

Les chemins équivalents créés par le kit sont des index, adaptateurs ou documents spécialisés. Ils ne doivent pas contenir une copie divergente d’un document canonique.

### 14.3 Registres de continuité

- `STATUS.md` : état instantané ;
- `LOOP_STATE.md` : état persistant de la boucle ;
- `CURRENT_ITERATION.md` : itération active ou clôturée ;
- `WORK_LOG.md` : actions et preuves ;
- `HANDOFF.md` : transmission ;
- `NEXT_ACTION.md` : une seule prochaine action exécutable ;
- `OPEN_QUESTIONS.md` : informations non fournies ou non vérifiées ;
- `DOCUMENT_INTEGRATION_MATRIX.md`, `FILES_CATALOG.md` et `MANIFEST.md` : taxonomie, présence et contrôles.

### 14.4 Résultat de LOOP-GOV-001

La boucle `LOOP-GOV-001` a intégré le kit version `1.0.0` de manière additive :

- `11` fichiers Markdown avant intervention ;
- `194` fichiers Markdown après intervention ;
- `176/176` chemins Markdown du kit présents ;
- `192` fichiers créés depuis le commit de départ, dont `183` Markdown et `9` fragments d’archive ;
- aucune suppression, aucun renommage et aucun déplacement historique ;
- artefacts YAML, CSV, JSON et schéma sous `regulatory/` et `schemas/` préservés ;
- sept ADR de gouvernance ajoutées ;
- branche `main` conservée ;
- aucun force-push, fusion, migration ou déploiement.

Les preuves, limites et contrôles sont détaillés dans `MANIFEST.md`, `WORK_LOG.md`, `docs/09-loop/LOOP_HEALTH_CHECK.md` et `SUIVI.md`.

### 14.5 État courant et prochaine priorité

L’état instantané n’est plus la section 13 historique : il est tenu dans [`STATUS.md`](STATUS.md).

La première matrice machine-readable de la Circulaire n°05/CREPMF/2022 existe déjà. La prochaine action unique est désormais celle de [`NEXT_ACTION.md`](NEXT_ACTION.md) : obtenir une copie officielle, vérifiable et exploitable de l’Instruction n°66/CREPMF/2021 avant son atomisation.
