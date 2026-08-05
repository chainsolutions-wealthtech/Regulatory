# AGENTS.md — Règles obligatoires pour tout agent connecté

Ce fichier s’applique à l’ensemble du dépôt `chainsolutions-wealthtech/Regulatory`.

Il doit être lu et respecté par toute personne, assistant, agent IA, outil de développement, automatisation ou connecteur intervenant sur le dépôt.

## 1. Mission du dépôt

Le dépôt construit une plateforme de connaissance réglementaire et de génération assistée de prospectus OPCVM/FCP UMOA.

Le système cible repose sur :

- un corpus réglementaire versionné ;
- un modèle canonique des fonds et organisations ;
- des référentiels préremplis ;
- un questionnaire dynamique à choix multiples ;
- un graphe de décision ;
- une bibliothèque de clauses juridiques validées ;
- un moteur de règles ;
- un moteur de composition documentaire ;
- une table de concordance ;
- un workflow de validation humaine ;
- un journal d’audit complet.

## 2. Règle absolue : ne jamais créer de nouvelle branche automatiquement

Tout agent connecté doit respecter les règles suivantes :

1. ne pas créer de nouvelle branche ;
2. ne pas proposer puis créer automatiquement une branche ;
3. rester sur la branche existante explicitement désignée ;
4. utiliser `main` lorsqu’aucune autre branche existante n’a été désignée ;
5. ne pas changer de branche sans instruction explicite du propriétaire ;
6. ne jamais effectuer de `force push` ;
7. ne jamais réécrire l’historique ;
8. ne jamais supprimer ou déplacer une branche sans autorisation explicite.

Si une opération semble exiger une nouvelle branche selon les habitudes de l’outil utilisé, l’agent doit s’arrêter et expliquer le blocage. Il ne doit pas contourner la règle.

## 3. Protocole obligatoire au début de chaque intervention

Avant de modifier quoi que ce soit, l’agent doit :

1. identifier le dépôt et la branche courante ;
2. lire `README.md` ;
3. lire intégralement `AGENTS.md` ;
4. lire `SUIVI.md` ;
5. lire `TODO.md` ;
6. lire `docs/DECISIONS.md` ;
7. lire `docs/ARCHITECTURE.md` ;
8. lire la spécification concernée ;
9. inspecter la structure complète du dépôt ;
10. lire les fichiers directement concernés ;
11. consulter les derniers commits pertinents ;
12. rechercher les travaux existants avant d’ajouter un nouvel objet, champ, identifiant, module ou document.

L’agent doit ensuite formuler un état des lieux factuel :

- ce qui existe déjà ;
- ce qui est validé ;
- ce qui est en cours ;
- ce qui manque ;
- les fichiers concernés ;
- le risque de régression ;
- le plan de modification ;
- les vérifications prévues.

## 4. Continuité obligatoire

Toute intervention doit continuer la logique existante.

Il est interdit de :

- recommencer le projet avec une autre architecture sans décision documentée ;
- créer un second modèle canonique concurrent ;
- dupliquer une table, une règle, une question ou une clause existante ;
- changer la terminologie validée sans migration ;
- remplacer silencieusement une décision antérieure ;
- ignorer les identifiants stables existants ;
- casser la compatibilité avec les données ou documents déjà générés ;
- supprimer une exigence parce qu’elle semble redondante ;
- simplifier une règle au prix de la traçabilité.

En cas de contradiction entre documents, l’agent doit la signaler et demander ou documenter une décision. Il ne doit pas choisir silencieusement une interprétation.

## 5. Zéro régression

Avant chaque modification, l’agent doit identifier :

- les données affectées ;
- les schémas affectés ;
- les règles affectées ;
- les clauses affectées ;
- les documents affectés ;
- les exports affectés ;
- les tests affectés ;
- les prospectus ou versions historiques potentiellement affectés.

Après modification, il doit vérifier au minimum :

- les tests existants ;
- les tests ajoutés ;
- la compatibilité des identifiants ;
- la stabilité des sorties non concernées ;
- la table de concordance ;
- la traçabilité des sources ;
- la documentation ;
- l’absence de secret ou de donnée sensible dans le dépôt.

Aucune modification fonctionnelle ne doit être considérée terminée sans test de non-régression adapté.

## 6. Règles relatives aux sources réglementaires

Une règle réglementaire doit toujours contenir :

- une source identifiable ;
- une version du texte ;
- une référence d’article, annexe ou point ;
- une juridiction ;
- un produit concerné ;
- une date d’effet ;
- une condition d’applicabilité ;
- un statut de validation ;
- une provenance documentaire.

Il est interdit de :

- créer une obligation sur la seule base d’un exemple de prospectus ;
- transformer une pratique observée en règle sans source ;
- inventer un taux, un seuil ou une formulation obligatoire ;
- déclarer une information conforme sans preuve suffisante ;
- confondre l’Instruction n°66/CREPMF/2021, la Circulaire n°05/CREPMF/2022 et les clauses propres à un fonds ;
- utiliser le guide AMF France comme base juridique du pack UMOA.

Les prospectus existants servent de cas d’étude et de cas de test. Les textes réglementaires versionnés restent la source normative.

## 7. Règles relatives aux données canoniques

Principe :

```text
Une information = un champ canonique = une source principale = plusieurs usages.
```

Tout nouveau champ doit comporter :

- un identifiant stable ;
- une définition ;
- un type ;
- une cardinalité ;
- une unité éventuelle ;
- une condition d’applicabilité ;
- une règle de validation ;
- une source ;
- une classification de sensibilité ;
- une politique de versionnement ;
- les documents et exports consommateurs.

Aucun champ existant ne doit être renommé ou supprimé sans :

- analyse d’impact ;
- décision documentée ;
- stratégie de migration ;
- compatibilité descendante ;
- tests.

## 8. Règles relatives aux questions et choix

Chaque question doit être reliée à :

- un ou plusieurs champs canoniques ;
- une ou plusieurs exigences ;
- des options structurées ;
- des conditions d’affichage ;
- des effets ;
- des validations ;
- des preuves éventuelles ;
- un rôle de revue.

Une réponse peut :

- activer ou masquer des questions ;
- sélectionner des clauses ;
- proposer des risques ;
- imposer des méthodes de valorisation ;
- demander des preuves ;
- déclencher des contrôles ;
- demander une revue juridique.

Les textes libres doivent être limités aux informations réellement spécifiques. Le système doit privilégier les référentiels, choix multiples et structures guidées.

## 9. Règles relatives aux clauses juridiques

Chaque clause doit avoir :

- un identifiant stable ;
- une version ;
- une juridiction ;
- un produit ;
- une section ;
- des exigences liées ;
- des conditions ;
- des variables autorisées ;
- une date d’effet ;
- un statut ;
- des approbateurs ;
- un historique.

Une clause active ne doit jamais être modifiée rétroactivement. Toute modification crée une nouvelle version.

Les catégories sont :

- verrouillée ;
- paramétrique ;
- conditionnelle ;
- composée ;
- factuelle ;
- spécifique avec revue juridique.

Une clause spécifique générée ou modifiée en dehors de la bibliothèque validée doit porter `LEGAL_REVIEW_REQUIRED`.

## 10. Règles relatives à la génération documentaire

Le générateur doit produire des documents déterministes à partir :

- des données canoniques ;
- de la version du pack réglementaire ;
- de la version des clauses ;
- de la version du modèle documentaire ;
- des décisions de couverture ;
- des validations.

Chaque paragraphe ou composant généré doit pouvoir être relié à :

- sa clause ;
- ses variables ;
- ses réponses sources ;
- ses exigences ;
- ses preuves ;
- sa version ;
- ses réviseurs.

Le système ne doit jamais présenter un document comme visé, agréé ou approuvé avant la décision formelle du régulateur.

## 11. Documentation obligatoire à chaque changement

Chaque changement significatif doit mettre à jour dans le même ensemble de modifications :

- `README.md` si la vision, le périmètre, le fonctionnement ou l’utilisation changent ;
- `SUIVI.md` avec la date, les travaux réalisés et les résultats ;
- `TODO.md` avec les tâches terminées et restantes ;
- `docs/DECISIONS.md` pour toute décision structurante ;
- `docs/ARCHITECTURE.md` pour toute évolution d’architecture ;
- `docs/PROSPECTUS_ENGINE_SPEC.md` pour toute évolution fonctionnelle ;
- `docs/REGULATORY_MAPPING.md` pour toute nouvelle exigence ou modification réglementaire ;
- `CHANGELOG.md` pour tout changement livrable ;
- les tests et exemples concernés.

La documentation n’est pas une tâche ultérieure. Elle fait partie du changement.

## 12. Commits

Les commits doivent :

- être atomiques ;
- décrire le résultat obtenu ;
- éviter les formulations vagues ;
- ne pas mélanger refonte non liée et correction ;
- inclure la documentation correspondante ;
- ne contenir aucun secret.

Préfixes recommandés :

```text
docs:
feat:
fix:
refactor:
test:
data:
regulatory:
chore:
```

## 13. Actions interdites

Sans autorisation explicite, il est interdit de :

- créer une branche ;
- effectuer un force push ;
- réécrire l’historique ;
- supprimer des fichiers de suivi ;
- supprimer des décisions validées ;
- introduire des secrets ;
- modifier des données de production ;
- déployer ;
- marquer un prospectus comme conforme ou approuvé ;
- supprimer des tests pour faire passer une modification ;
- modifier plusieurs objets réglementaires sans analyse d’impact ;
- utiliser une IA comme source normative.

## 14. Checklist de fin d’intervention

Avant de déclarer une tâche terminée :

- [ ] la branche existante a été conservée ;
- [ ] aucun historique n’a été réécrit ;
- [ ] les documents obligatoires ont été lus ;
- [ ] l’existant a été réutilisé ;
- [ ] les sources réglementaires sont citées dans les données ou spécifications ;
- [ ] les impacts ont été analysés ;
- [ ] les tests ont été exécutés ;
- [ ] les tests de non-régression ont été ajoutés si nécessaire ;
- [ ] la documentation a été mise à jour ;
- [ ] `SUIVI.md` est à jour ;
- [ ] `TODO.md` est à jour ;
- [ ] les limitations et incertitudes sont déclarées ;
- [ ] aucun secret n’a été ajouté ;
- [ ] le résultat continue la logique existante sans régression.

## 15. Intégration du Loop Engineering

Cette section enrichit les règles historiques sans les remplacer.

### 15.1 Point d’entrée et ordre de lecture

Toute intervention commence désormais par `00_START_HERE.md`, qui définit l’ordre de lecture complet. Cet ordre inclut toutes les obligations historiques de la section 3 et ajoute notamment :

- `SOURCE_OF_TRUTH.md` ;
- `PROJECT_CONTEXT.md` ;
- `STATUS.md` ;
- `NEXT_ACTION.md` ;
- `LOOP_STATE.md` ;
- `CURRENT_ITERATION.md`.

Aucun agent ne doit interpréter la section 3 comme une autorisation de sauter `00_START_HERE.md`.

### 15.2 Hiérarchie documentaire

- `SOURCE_OF_TRUTH.md` définit les documents canoniques et les adaptateurs ;
- `SUIVI.md` reste l’historique chronologique canonique ;
- `STATUS.md` est la photographie de l’état courant ;
- `TODO.md` reste le registre opérationnel principal ;
- `WORK_LOG.md` journalise les actions de la boucle ;
- `HANDOFF.md` transmet l’état au prochain intervenant ;
- `NEXT_ACTION.md` contient une seule action exécutable ;
- `docs/DECISIONS.md` conserve les décisions historiques et `docs/adr/` les décisions détaillées futures ;
- `docs/ARCHITECTURE.md` reste l’architecture canonique ;
- `docs/03-architecture/ARCHITECTURE.md` est un adaptateur et ne doit pas dupliquer l’architecture.

Les conversations ne constituent jamais la mémoire canonique du projet.

### 15.3 Boucle obligatoire

Avant d’agir, l’agent doit identifier ou ouvrir une boucle documentée avec :

- un identifiant stable ;
- un objectif borné ;
- un état initial ;
- une tâche liée ;
- des critères de sortie ;
- des contrôles et preuves ;
- une prochaine action unique.

À la fin, il met à jour selon la portée réelle : `STATUS.md`, `LOOP_STATE.md`, `CURRENT_ITERATION.md`, `WORK_LOG.md`, `NEXT_ACTION.md`, `HANDOFF.md`, `SUIVI.md`, `TODO.md` et `CHANGELOG.md`.

### 15.4 Modules conditionnels

Tout module conditionnel porte l’un des statuts suivants :

- `APPLICABLE` ;
- `NON APPLICABLE`, avec justification ;
- `À DÉTERMINER`, avec une entrée correspondante dans `OPEN_QUESTIONS.md` ou `TODO.md`.

Pour toute information absente ou non vérifiée, utiliser exactement :

> À DÉFINIR — information non fournie ou non vérifiée à ce stade du projet.

### 15.5 Règles des adaptateurs IA

`CLAUDE.md`, `GEMINI.md` et `.github/copilot-instructions.md` sont des adaptateurs. Ils renvoient vers `00_START_HERE.md`, le présent fichier et les sources canoniques. Ils ne doivent ni introduire une politique concurrente, ni importer le contexte métier d’un autre projet.

### 15.6 Clôture et vérité des validations

Une boucle documentaire peut être `CLOSED` sans que le produit soit juridiquement validé, techniquement implémenté ou prêt pour la production. Toute validation doit préciser sa nature exacte : structurelle, documentaire, technique, conformité, juridique, fiscale ou réglementaire.
