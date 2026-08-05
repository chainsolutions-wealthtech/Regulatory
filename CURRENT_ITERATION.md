# CURRENT_ITERATION — LOOP-REG-001

> **Statut :** `IN_PROGRESS`  
> **Ouverte le :** 2026-08-05

## Objectif

Enregistrer une source vérifiable de l’Instruction n°66/CREPMF/2021 et préparer son atomisation complète, sans modifier les identifiants existants de la Circulaire n°05/CREPMF/2022.

## Pourquoi cette boucle a été ouverte

La boucle documentaire `LOOP-GOV-001` avait défini comme prochaine action unique l’obtention d’une source officielle de l’Instruction n°66/CREPMF/2021. Le propriétaire a fourni le registre réglementaire AMF-UMOA permettant d’identifier les Instructions et Circulaires applicables.

## État initial vérifié

- branche `main` au commit `4a62d87520ce62fcea52c8794f1c9b72cbec439d` ;
- une seule branche présente ;
- Circulaire n°05/CREPMF/2022 déjà représentée par `62` exigences et quatre matrices ;
- modèle canonique V0.1 de `30` objets ;
- Instruction n°66/CREPMF/2021 non encore enregistrée dans le manifeste ni atomisée.

## Travail déjà réalisé dans l’itération

- vérification du registre officiel AMF-UMOA ;
- confirmation du statut affiché `NON ABROGE` ;
- identification de la publication BRVM du 12 janvier 2022 ;
- identification du PDF distant de `65` pages ;
- création du registre source YAML ;
- création d’un plan d’atomisation en dix phases ;
- ajout de la source et du plan au manifeste ;
- ouverture de la boucle et mise à jour de la question `OQ-002`.

## Périmètre restant

- matérialiser une copie exploitable du PDF et calculer taille et SHA-256 ;
- confirmer la date de signature et la date d’effet ;
- identifier le texte précédent annulé et remplacé ;
- vérifier les modificatifs, rectificatifs et textes connexes ;
- produire l’index machine-readable de tous les articles ;
- préparer le crosswalk avec `CIRC005` et le modèle canonique.

## Hors périmètre de cette étape

- rédaction ou activation de clauses juridiques ;
- implémentation applicative ;
- modification des `62` exigences CIRC005 ;
- modification des quatre matrices existantes ;
- validation juridique ou conformité finale ;
- déploiement ou modification de données de production.

## Critères de sortie

- [x] registre officiel identifié ;
- [x] statut courant documenté ;
- [x] publication et PDF identifiés ;
- [x] source YAML créée ;
- [x] plan d’atomisation créé ;
- [ ] SHA-256 et taille du PDF calculés ;
- [ ] dates de signature et d’effet confirmées ;
- [ ] prédécesseur et textes modificatifs inventoriés ;
- [ ] index structurel complet produit ;
- [ ] contrôles de non-régression exécutés ;
- [ ] documentation de clôture et handoff finalisés.
