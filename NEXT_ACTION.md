# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY`  
> **Boucle :** `LOOP-REG-001`  
> **Garde-fou :** aucune activation réglementaire automatique

## Action

Poursuivre la revue exacte de l'Instruction n°66 à partir du PDF officiel hashé pour fermer les domaines encore insuffisamment qualifiés : commissariat aux comptes hors reporting déjà couvert, activités de conseil et de commercialisation, intervenants de distribution lorsqu'ils sont explicitement prévus, dispositions résiduelles de cycle de vie et références de contrôle/enforcement.

## Méthode obligatoire

1. Partir du PDF officiel hashé et de `INST066_ARTICLE_BLOCKS_V0_1.json`.
2. Rechercher la disposition exacte avant de créer une exigence.
3. Réutiliser un candidat existant lorsqu'il couvre déjà le sens normatif.
4. Créer un nouvel identifiant `INST066_ARTxxx_REQyyy` uniquement pour une obligation distincte.
5. Conserver `status=EXTRACTED_UNVERIFIED_PENDING_LEGAL_AND_COMPLIANCE_REVIEW`.
6. Conserver `activation=FORBIDDEN`.
7. Exiger `LEGAL` et `COMPLIANCE` dans les rôles de revue.
8. Ne jamais activer automatiquement un seuil numérique provenant de l'OCR.
9. Ne créer aucune exigence « sanctions » si aucune disposition source explicite n'est localisée dans l'Instruction 66 ; enregistrer alors le domaine comme dépendance d'un autre texte réglementaire.
10. Compiler, contrôler les doublons, vérifier les liens `CIRC005_*` et confirmer que les quatre matrices CIRC005 restent byte-identiques.

## État de départ vérifié

- articles Instruction 66 : `92` ;
- exigences candidates détaillées compilées : `111` ;
- staged : `0` ;
- compilation : `PASS` ;
- métadonnées source : `PASS` ;
- Security and Review Policy CI : `PASS` ;
- Regulatory CI complète : `PASS` ;
- revue juridique : `PENDING` ;
- revue conformité : `PENDING` ;
- activation : `FORBIDDEN` ;
- `ready_for_submission=false`.

## Après fermeture de ce lot réglementaire

Construire le **workflow de revue réglementaire des candidats Instruction 66** : file de revue par article/exigence, comparaison PDF/OCR, décisions Juridique + Conformité, justification, preuve, versionnement et promotion contrôlée d'un candidat vers un registre validé distinct. Aucune exigence candidate ne doit être injectée dans le catalogue applicatif avant cette double validation.

## Condition d'arrêt

Ne pas déduire une obligation d'une simple pratique de marché, d'un autre texte ou d'une hypothèse métier. Une exigence non supportée par une disposition explicite de la source doit rester absente de l'Instruction 66 et être consignée comme dépendance réglementaire externe à rechercher.
