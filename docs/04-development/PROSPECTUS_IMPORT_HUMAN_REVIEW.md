# Revue humaine des valeurs importées depuis un prospectus

## Statut

Conception de sécurité pour la tranche d'import assisté. La revue d'une proposition extraite reste distincte de l'écriture canonique et de toute approbation réglementaire.

## Principe

Un extracteur PDF/DOCX ne produit que des propositions `EXTRACTED_UNVERIFIED`. Une décision humaine peut ensuite classer chaque proposition :

- `CONFIRMED_BY_HUMAN` ;
- `REJECTED_BY_HUMAN`.

La confirmation signifie uniquement que la valeur extraite a été examinée par un utilisateur identifié. Elle ne signifie pas :

- que la valeur a été écrite dans le modèle canonique ;
- que la clause ou le prospectus est juridiquement approuvé ;
- que le dossier est prêt à être soumis ;
- que la source officielle ou le régulateur a validé l'information.

## États du batch

- `EXTRACTED_UNVERIFIED` : aucune proposition n'a été revue ;
- `HUMAN_REVIEW_IN_PROGRESS` : au moins une proposition est revue et au moins une reste non vérifiée ;
- `REVIEWED` : toutes les propositions ont reçu une décision humaine.

Dans tous les états :

- `canonicalWriteAllowed=false` ;
- `readyForSubmission=false`.

## Invariants

1. La revue retourne un nouveau batch et ne mute pas silencieusement l'objet source.
2. `extractedValue`, `evidenceObjectId`, `evidenceSha256` et `sourceLocation` restent inchangés par la décision humaine.
3. `reviewedBy` est obligatoire.
4. `reviewedAt` est obligatoire et doit être une date valide ; il peut être généré au moment de la décision si le caller ne le fournit pas.
5. Une proposition déjà revue ne peut pas être écrasée par une seconde décision via la même primitive.
6. Un identifiant de proposition inconnu est rejeté.
7. Une confirmation humaine ne déclenche jamais une écriture de projet.
8. Une revue complète ne déverrouille jamais la soumission.

## Étape ultérieure distincte

L'application pourra plus tard proposer une action explicite de **copie contrôlée vers une réponse projet**, soumise à :

- autorisation RBAC `ANSWER_WRITE` ;
- concurrence optimiste sur la version projet ;
- confirmation explicite de la valeur et du champ cible ;
- création d'une nouvelle version projet ;
- conservation de la provenance d'import dans l'audit ;
- aucun contournement des contrôles réglementaires ;
- `ready_for_submission=false`.

Cette étape n'est pas incluse dans le moteur de revue et ne doit jamais être implicitement exécutée par `CONFIRMED_BY_HUMAN`.
