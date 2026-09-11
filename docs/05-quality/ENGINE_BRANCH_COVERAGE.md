# Couverture des branches des moteurs

## Objet

Ce document décrit la couverture de non-régression des moteurs déterministes du projet. Il ne constitue aucune validation réglementaire et n’active aucune règle supplémentaire.

## Périmètre couvert

- combinateurs conditionnels `all`, `any`, `not` ;
- opérateurs `equals`, `not_equals`, `exists`, `not_empty`, `includes`, `greater_than` et rejet explicite d’un opérateur inconnu ;
- construction du catalogue questionnaire, exclusion des lignes `SYSTEM`, normalisation des chemins ;
- refus d’une question inconnue ;
- contrôle strict des chemins canoniques : un champ parent ne peut plus contourner une autorisation limitée à un enfant ;
- extensions exécutables explicitement autorisées ;
- visibilité conditionnelle des questions rachat et conseiller externe ;
- statuts de règles `PASSED`, `PASSED_WITH_WARNINGS`, `VALIDATION_FAILED` ;
- règles d’identité, classes de parts, allocations, valorisation, rachat, suspension, frais, fiscalité et revue juridique.

## Invariants

Les tests conservent `ready_for_submission=false`. Les avertissements TAX/LEGAL restent non bloquants ; les règles BLOCKER conservent leur sémantique. Aucune règle réglementaire nouvelle n’est déduite de ces tests.

La couverture est une preuve de chemins logiciels exercés, pas une preuve d’exhaustivité juridique du corpus réglementaire.
