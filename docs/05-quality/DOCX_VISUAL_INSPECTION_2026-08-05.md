# Inspection visuelle DOCX — United Capital Diamond

> **Date :** `2026-08-05`  
> **Boucle :** `LOOP-DEV-001`  
> **Statut :** `PASS_WITH_DECLARED_DENSITY_LIMITATION`  
> **Nature :** contrôle visuel technique d’un document de pré-conformité, sans validation juridique ni réglementaire.

## 1. Objet

Contrôler visuellement le fichier `prospectus-draft.docx` généré de manière déterministe à partir du modèle documentaire du cas United Capital Diamond.

Le contrôle porte sur :

- la lisibilité générale ;
- l’absence de débordement ou de texte coupé ;
- les titres et espacements ;
- les avertissements ;
- les tableaux ;
- les listes de risques ;
- les pieds de page ;
- la pagination de l’annexe de traçabilité ;
- l’état final de pré-conformité.

## 2. Preuves inspectées

- workflow GitHub Actions : `Regulatory CI`, exécution `30972091083` ;
- conclusion du workflow : `success` ;
- artefact : `united-capital-diamond-docx-review` ;
- identifiant d’artefact : `8916899188` ;
- empreinte de l’archive d’artefact : `sha256:5c8c4951f5bb8f624347192b547b007be735838c5196901653dfc530658b871c` ;
- nombre de pages rendues : `10` ;
- moteur de rendu de contrôle : LibreOffice Writer puis `pdftoppm` ;
- inspection effectuée sur chacune des dix images PNG.

## 3. Anomalies détectées pendant la première inspection

Deux défauts ont été identifiés dans la première version rendue :

1. les éléments de la liste des risques étaient indentés mais ne présentaient pas de puce visible ;
2. une ligne du tableau de traçabilité était fractionnée entre deux pages.

## 4. Corrections appliquées

Le module `scripts/optimize_docx_layout.py` a été ajouté pour :

- insérer une puce visible devant chaque élément de liste ;
- ajouter `w:cantSplit` à chaque ligne de tableau ;
- reconstruire le paquet OOXML de manière déterministe ;
- recalculer l’empreinte et la taille du DOCX dans `docx-manifest.json`.

Le validateur `scripts/validate_docx.py` vérifie désormais :

- la présence des puces visibles ;
- la protection de chaque ligne de tableau contre le fractionnement ;
- la cohérence de l’empreinte SHA-256 ;
- la cohérence de la taille du fichier ;
- les mentions obligatoires de pré-conformité ;
- l’interdiction de présenter le document comme prêt pour soumission.

## 5. Inspection page par page après correction

| Page | Contenu principal | Résultat |
|---:|---|---|
| 1 | Couverture, avertissement et métadonnées de génération | `PASS` — couverture équilibrée, avertissement lisible, statut et absence de préparation à la soumission clairement affichés. |
| 2 | Introduction, identité, fiscalité, comptabilité et début des parts | `PASS` — titres hiérarchisés, avertissements visibles, tableau de classe de parts dans les marges. |
| 3 | Parts, émission, rachat, revenus et politique d’investissement | `PASS` — aucun texte coupé, espacements cohérents. |
| 4 | Fourchettes d’actifs, risques, valorisation, prix et début des frais | `PASS` — puces désormais visibles, tableaux lisibles et contenus dans la page. |
| 5 | Suite des frais, société de gestion, gouvernance et dépositaire | `PASS` — tableau paginé proprement, rubriques institutionnelles lisibles. |
| 6 | Conseillers, dispositifs pays, performances, investisseur-type et autres frais | `PASS` — tableaux et avertissement 5.3 correctement rendus. |
| 7 | Début de l’annexe technique de traçabilité | `PASS_WITH_DENSITY_LIMITATION` — toutes les cellules sont lisibles ; les identifiants longs se replient sur plusieurs lignes. |
| 8 | Suite de l’annexe technique de traçabilité | `PASS_WITH_DENSITY_LIMITATION` — aucune ligne fractionnée entre pages ; densité élevée mais acceptable pour une annexe technique. |
| 9 | Fin de l’annexe technique de traçabilité | `PASS_WITH_DENSITY_LIMITATION` — aucune ligne orpheline ou coupée. |
| 10 | État de pré-conformité et avertissement final | `PASS` — compteurs cohérents et interdiction de soumission clairement affichée. |

## 6. Verdict

Le DOCX est **structurellement valide et visuellement exploitable comme document de pré-conformité**.

La densité de l’annexe technique est acceptée pour la tranche actuelle parce qu’elle conserve l’intégralité de la traçabilité. Une amélioration ultérieure pourra générer cette annexe en orientation paysage ou dans un rapport séparé, sans supprimer les informations.

Ce verdict ne signifie pas :

- conformité juridique ;
- validation conformité ;
- validation fiscale ;
- agrément ;
- visa ;
- approbation de l’AMF-UMOA ;
- aptitude à une soumission réglementaire.

## 7. Critères de clôture de la tranche DOCX

- [x] génération DOCX déterministe ;
- [x] validation OOXML ;
- [x] avertissements obligatoires ;
- [x] traçabilité incluse ;
- [x] dix pages rendues ;
- [x] dix pages inspectées ;
- [x] défauts de listes et pagination corrigés ;
- [x] seconde inspection complète réussie ;
- [x] documentation et preuves enregistrées ;
- [ ] validation juridique et conformité — hors périmètre de cette inspection.
