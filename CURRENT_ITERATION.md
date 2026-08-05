# CURRENT_ITERATION — LOOP-DEV-001

> **Statut :** `IN_PROGRESS`  
> **Ouverte le :** 2026-08-05

## Objectif

Construire la première tranche verticale exécutable du moteur de prospectus FCP/OPCVM UMOA afin de transformer les matrices réglementaires et des réponses structurées en données canoniques, contrôles, composants documentaires, prospectus de travail et table de concordance.

## Décision de priorité

Le propriétaire a demandé de commencer immédiatement le code de construction du prospectus. `LOOP-REG-001` n’est pas clôturée : elle est suspendue avec ses travaux restants préservés. La priorité active devient `LOOP-DEV-001`.

## État initial vérifié

- branche unique : `main` ;
- commit de départ : `a2a7d0a26802169a859b5bf02ca5e88798f483a8` ;
- aucun code applicatif ni `package.json` ;
- 62 exigences CIRC005 ;
- quatre matrices CSV ;
- modèle canonique architectural de 30 objets ;
- aucune clause `APPROVED` ou `ACTIVE`.

## Travail réalisé dans l’itération

- ajout d’un projet Node.js 22 sans dépendance externe ;
- chargement exécutable des quatre matrices CIRC005 ;
- création du catalogue de questions ;
- application contrôlée des réponses aux chemins canoniques ;
- création d’un moteur conditionnel initial ;
- création d’un moteur de règles initial ;
- création d’une bibliothèque de clauses DRAFT ;
- création du modèle documentaire et du compositeur Markdown ;
- création de la table de concordance et du manifeste déterministe ;
- création du cas United Capital Diamond prérempli ;
- génération de sorties de contrôle et de traçabilité ;
- ajout de sept tests automatisés ;
- résultat local : `7/7` tests réussis ;
- couverture du cas initial : `46` exigences dans le prospectus, `1` non applicable et `15` manquantes ;
- contrôles : `0` blocage, `2` avertissements ;
- statut du dossier : `DATA_INCOMPLETE` ;
- soumission : interdite.

## Périmètre restant

- couvrir les 15 exigences encore manquantes ;
- enrichir le catalogue de questions conditionnelles ;
- produire le JSON Schema canonique détaillé ;
- ajouter la persistance versionnée ;
- séparer les clauses du code vers un registre versionné ;
- ajouter le rendu DOCX puis PDF ;
- reprendre et terminer `LOOP-REG-001` pour l’Instruction n°66 ;
- obtenir les validations juridique, conformité et fiscale.

## Critères de sortie de LOOP-DEV-001

- [x] moteur exécutable sans dépendance externe ;
- [x] matrices existantes utilisées comme source ;
- [x] cas d’exemple généré ;
- [x] tests automatisés réussis localement ;
- [x] concordance produite sur les 62 exigences ;
- [ ] zéro exigence obligatoire non traitée dans le cas standard ;
- [ ] schéma canonique détaillé validé structurellement ;
- [ ] clauses externalisées et versionnées ;
- [ ] rendu DOCX déterministe ;
- [ ] rendu PDF contrôlé ;
- [ ] revue humaine du modèle et des clauses.
