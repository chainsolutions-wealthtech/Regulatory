# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY`  
> **Boucle :** `LOOP-DEV-001`

## Action

Réduire de `15` à `0` le nombre d’exigences CIRC005 manquantes dans le cas standard United Capital Diamond en complétant les données, questions, clauses DRAFT, composants et contrôles nécessaires, sans déclarer aucune clause approuvée.

## Entrées obligatoires

- `examples/generated/united-capital-diamond/generation-manifest.json` ;
- `regulatory/matrices/CIRC005_FCP_MATRIX_*.csv` ;
- `examples/united-capital-diamond/preloaded-data.json` ;
- `examples/united-capital-diamond/answers.json` ;
- `src/catalog/clause-catalog.js` ;
- `src/core/prospectus-composer.js` ;
- `docs/PROSPECTUS_ENGINE_SPEC.md`.

## Méthode

1. générer la concordance complète par `npm run generate:sample` ;
2. extraire la liste exacte des 15 exigences `MISSING` ;
3. classer chaque manque en donnée absente, question absente, clause absente, section absente ou information réellement non applicable ;
4. compléter uniquement les éléments soutenus par une source ou marquer la revue requise ;
5. générer de nouveau le dossier ;
6. exécuter `npm run check` ;
7. vérifier que la baisse du nombre de manques ne provient pas d’un classement artificiel en `NOT_APPLICABLE` ;
8. mettre à jour les registres de boucle.

## Résultat attendu

- concordance complète sur les 62 exigences ;
- aucune exigence obligatoire silencieusement omise ;
- tous les cas incertains marqués `LEGAL_REVIEW_REQUIRED`, `TAX_AND_LEGAL_REVIEW_REQUIRED` ou `PENDING_CONFIRMATION` ;
- `ready_for_submission` maintenu à `false` ;
- tests de non-régression réussis.
