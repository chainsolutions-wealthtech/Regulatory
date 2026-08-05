# STATUS — État courant du projet

> **Date de référence :** 2026-08-05  
> **Branche :** `main`  
> **Boucle active :** `LOOP-DEV-001`  
> **État global :** `EXECUTABLE_VERTICAL_SLICE_IN_PROGRESS`

## Résumé

Le dépôt n’est plus uniquement documentaire. Il contient maintenant une première tranche verticale exécutable du Prospectus Composer UMOA/FCP.

La tranche lit les quatre matrices CIRC005 existantes, applique un jeu de réponses structurées à un modèle canonique, exécute des contrôles déterministes, sélectionne des clauses DRAFT, compose un projet de prospectus Markdown et produit la concordance et le manifeste de génération.

## État technique

- runtime : Node.js `22+` ;
- dépendances externes : aucune ;
- tests locaux : `7/7 PASS` ;
- commande complète : `npm run check` ;
- exigences chargées : `62` ;
- questions applicables au cas : `58` ;
- réponses du cas : `30` ;
- composants documentaires : `29`.

## Cas United Capital Diamond

- exigences `IN_PROSPECTUS` : `46` ;
- exigences `NOT_APPLICABLE` : `1` ;
- exigences `MISSING` : `15` ;
- blocages automatiques : `0` ;
- avertissements : `2` ;
- statut : `DATA_INCOMPLETE` ;
- prêt pour revue conformité : `false` ;
- prêt pour soumission : `false`.

Les deux avertissements actuels concernent :

- l’absence de source fiscale validée ;
- l’interprétation du point 5.3 relatif aux informations d’ordre économique.

## Livrables actuels

Le dépôt versionne le projet de prospectus, le rapport de contrôles et le manifeste. La commande `npm run generate:sample` régénère en plus les données canoniques, l’état du questionnaire, la concordance complète, le modèle documentaire et le journal des réponses.

## Limites

- prototype technique, pas application de production ;
- aucun DOCX/PDF généré ;
- aucune persistance ni interface web ;
- aucune clause approuvée ;
- 15 exigences encore manquantes ;
- corpus réglementaire incomplet ;
- Instruction n°66 non atomisée ;
- revue juridique, conformité et fiscale non réalisée.

## Boucle réglementaire

`LOOP-REG-001` est `PAUSED_BY_OWNER_PRIORITY`, non clôturée. Ses résultats et tâches restantes restent valides.

## Prochaine action

Voir `NEXT_ACTION.md` : couvrir les 15 exigences manquantes sans inventer de données ni détourner les statuts de couverture.

<!-- AUTO:LOOP-DEV-001-COVERAGE:START -->
## Mise à jour LOOP-DEV-001 — Réconciliation CIRC005 V0.2

- exigences analysées : `62` ;
- composants documentaires : `44` ;
- couvertes dans le prospectus : `40` ;
- en attente de revue : `20` ;
- manquantes : `0` ;
- non applicables : `1` ;
- métadonnées système : `1` ;
- avertissements : `7` ;
- blocages : `0` ;
- prêt pour revue conformité : `false` ;
- prêt pour soumission : `false`.

Le prospectus reste un projet de pré-conformité. Les profils institutionnels, la fiscalité, la constitution du Fonds, la gouvernance, le dépositaire, la liquidation et les autres rubriques non vérifiées restent en attente de revue.
<!-- AUTO:LOOP-DEV-001-COVERAGE:END -->

<!-- AUTO:LOOP-DEV-001-DOCX:START -->
## Mise à jour LOOP-DEV-001 — DOCX V0.1

- DOCX : `prospectus-draft.docx` ;
- taille : `13208` octets ;
- empreinte SHA-256 : `673b075cbe8cb31fb9418bc7157af7bbed1f882c53e41627f4d61910f523aa95` ;
- composants tracés : `44` ;
- lignes de traçabilité : `44` ;
- tableaux OOXML : `9` ;
- pages rendues pour contrôle visuel : `10` ;
- statut : `DRAFT_PRE_COMPLIANCE_REVIEW` ;
- prêt pour soumission : `false`.

Le DOCX reste un document de pré-conformité. Les exigences `PENDING_REVIEW` et les validations humaines demeurent inchangées.
<!-- AUTO:LOOP-DEV-001-DOCX:END -->
