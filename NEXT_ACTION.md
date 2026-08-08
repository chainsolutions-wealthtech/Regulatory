# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY`
> **Boucle :** `LOOP-REG-001`

## Action

Matérialiser la **Décision n° CM/SJ/O01/03/2016** relative au dispositif des sanctions pécuniaires à partir d'une source binaire officielle, puis l'indexer et l'atomiser sous un préfixe propre sans activer aucun barème ni aucune sanction.

La dépendance est déjà enregistrée dans :

`regulatory/sources/DECISION_CM_SJ_001_03_2016.yaml`

Le registre officiel AMF-UMOA a été observé avec le statut `NON_ABROGE`, mais le PDF binaire officiel, son SHA-256, sa pagination et son texte structuré ne sont pas encore matérialisés dans le dépôt.

Une révision du dispositif des sanctions a par ailleurs été officiellement adoptée par le Conseil des Ministres de l'UMOA le 24 juin 2022. Sa référence a été identifiée comme **Décision n° CM/10/06/2022**, mais son texte binaire officiel n'est pas encore matérialisé. La relation juridique entre le dispositif 2016 et cette révision 2022 doit donc être établie sur sources officielles avant toute conclusion sur le régime applicable.

## Résultat attendu

- identifier une URL binaire officielle stable de la décision de 2016 ;
- télécharger le PDF officiel et vérifier son magic PDF ;
- calculer SHA-256, taille et pagination ;
- extraire le texte avec OCR uniquement si nécessaire ;
- produire un index machine-readable des articles ;
- créer des blocs/atomes de source séparés de `INST058_*` ;
- relier les dispositions pertinentes à `INST058_ART031_REQ001` et `INST058_ART032_REQ001` ;
- identifier et matérialiser la Décision n° `CM/10/06/2022` depuis une source officielle ;
- comparer juridiquement 2016 ↔ 2022 sans déduire silencieusement une abrogation ou une substitution ;
- conserver toute interprétation, tout montant et tout barème en `PENDING_LEGAL_AND_COMPLIANCE_REVIEW` ;
- maintenir `activation=FORBIDDEN` et `ready_for_submission=false`.

## Condition d'arrêt

Si aucune URL binaire officielle n'est obtenue, ne pas utiliser une copie Scribd ou une copie tierce comme source normative. Conserver la décision concernée comme dépendance officielle identifiée, documenter `OFFICIAL_BINARY_NOT_MATERIALIZED` et ne modéliser aucun montant ni barème comme actif.
