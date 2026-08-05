# NEXT_ACTION — Une seule action exécutable

> **Statut :** `READY`  
> **Prérequis documentaire :** `LOOP-GOV-001` clôturée le 2026-08-05.

## Action

Obtenir une copie officielle, vérifiable et exploitable de l’Instruction n°66/CREPMF/2021, l’enregistrer dans le registre des sources, puis préparer son atomisation sans modifier les identifiants existants de la Circulaire n°05/CREPMF/2022.

## Préconditions

- source officielle ou copie dont la provenance peut être vérifiée ;
- confirmation du numéro, de la version, de la date, des éventuelles modifications, rectificatifs, abrogations et du statut juridique ;
- empreinte du document source ;
- nouvelle boucle distincte avec objectif, périmètre, contrôles et critères de sortie ;
- maintien de `main`, sauf désignation explicite d’une autre branche déjà existante.

## Fichiers concernés

- `regulatory/sources/`
- `regulatory/requirements/`
- `docs/REGULATORY_MAPPING.md`
- `SUIVI.md`
- `TODO.md`
- registres de la nouvelle boucle

## Résultat attendu

Une source versionnée avec empreinte, provenance et statut, accompagnée d’un plan d’atomisation et d’une nouvelle boucle distincte. Aucun wording juridique ne doit devenir `APPROVED` ou `ACTIVE` sans revue formelle.

## Preuves attendues

- URL officielle ou document officiel ;
- copie source autorisée ou référence d’archive ;
- SHA-256 ;
- métadonnées et dates vérifiées ;
- analyse des versions et textes modificatifs ;
- diff contrôlé ;
- validation structurelle ;
- limites juridiques explicitement déclarées.

## Condition d’arrêt

En l’absence d’une source suffisamment vérifiable, ne pas inventer ni atomiser le texte : consigner le blocage dans `OPEN_QUESTIONS.md`, `STATUS.md`, `SUIVI.md` et `TODO.md`.
