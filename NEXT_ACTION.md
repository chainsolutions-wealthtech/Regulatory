# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY`  
> **Boucle :** `LOOP-DEV-001`

## Action

Implémenter un export DOCX déterministe de pré-conformité à partir du `document-model.json`, en conservant pour chaque composant son identifiant, ses exigences, sa clause, ses champs sources et son statut de revue.

## Préconditions satisfaites

- concordance sur `62` exigences ;
- `MISSING = 0` ;
- exigences non vérifiées conservées en `PENDING_REVIEW` ;
- génération Markdown et JSON déterministe ;
- tests automatisés présents ;
- `ready_for_submission = false`.

## Résultat attendu

- fichier `prospectus-draft.docx` généré depuis le modèle documentaire ;
- rendu reproductible pour le même snapshot ;
- styles, titres, tableaux, avertissements et sauts de page contrôlés ;
- aucune suppression de la traçabilité ;
- tests de structure DOCX ;
- documentation et preuves mises à jour ;
- aucune conversion PDF dans cette tranche.

## Condition d’arrêt

Le DOCX reste un document de pré-conformité. Il ne doit comporter aucune mention laissant entendre un agrément, un visa, une approbation ou une conformité finale.
