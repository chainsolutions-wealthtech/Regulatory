# Kit Loop Engineering — Source et intégrité

> **Statut :** `APPLICABLE`  
> **Autorité :** métadonnées et inventaire du kit reçu.  
> **Important :** les fragments Base64 actuellement présents ne constituent pas une copie binaire validée du ZIP.

## Kit reçu

- Nom reçu : `loop-engineering-starter-kit(1).zip`
- Version du manifeste : `1.0.0`
- Taille du ZIP source : `112477` octets
- SHA-256 du ZIP source : `8054b1ea4799364b5d709166536c927b2e28ddd47aba84553469a5469ffecc95`
- Contenu source vérifié : `176` fichiers Markdown et un manifeste JSON, soit `177` entrées uniques.
- Longueur Base64 attendue pour le ZIP source : `149972` caractères.
- Découpage attendu à `12000` caractères : `13` parties, dont la dernière de `5972` caractères.

## État réel dans le dépôt

Le connecteur GitHub utilisé n’a pas permis de téléverser directement le binaire local. Neuf fichiers historiques ont été créés sous `docs/kits/parts/`, mais le contrôle final a établi qu’ils ne correspondent pas au découpage attendu :

- parties présentes : `9` au lieu de `13` ;
- longueur cumulée observée : `164786` caractères, supérieure à la longueur Base64 attendue `149972` ;
- contenu du dernier fragment comportant des données répétées ;
- reconstruction octet pour octet et correspondance SHA-256 : **non validées**.

Ces neuf fragments sont conservés pour la traçabilité Git et ne doivent pas être supprimés ni utilisés comme archive source. Ils ont le statut `INVALID_UNVERIFIED_LEGACY_FRAGMENTS`.

## Source de vérité du kit

Pour cette intégration documentaire, la preuve canonique est constituée par :

1. le nom, la taille et le SHA-256 du ZIP reçu ;
2. le manifeste version `1.0.0` ;
3. l’inventaire des `176` chemins Markdown ;
4. la présence des `176/176` chemins dans l’arborescence finale ;
5. les contenus intégrés et contrôlés comme non vides et non limités à un titre.

Les fragments sous `docs/kits/parts/` sont explicitement exclus de la source de vérité.

## Correction future autorisée

Une future boucle dédiée pourra ajouter, sans supprimer les fragments historiques :

- soit le ZIP binaire exact ;
- soit un nouveau jeu complet de `13` fragments sous un nouveau chemin versionné ;
- soit une archive externe officielle et pérenne.

La correction ne sera acceptée qu’après :

```bash
sha256sum loop-engineering-starter-kit-1.0.0.zip
# résultat attendu :
# 8054b1ea4799364b5d709166536c927b2e28ddd47aba84553469a5469ffecc95
```

## Règles

- ne pas reconstruire le ZIP à partir des neuf fragments actuels ;
- ne pas modifier silencieusement une partie existante ;
- toute représentation corrigée utilise un nouveau chemin ou une nouvelle version ;
- ne pas traiter le kit comme source métier ou réglementaire ;
- enregistrer toute correction dans `DRIFT_DETECTION.md`, `WORK_LOG.md` et `SUIVI.md`.

## Checklist d’intégrité

- [x] métadonnées du ZIP source enregistrées ;
- [x] taille et SHA-256 source enregistrés ;
- [x] manifeste et `176` chemins vérifiés ;
- [x] `176/176` chemins présents dans le dépôt ;
- [x] anomalie des fragments historiques déclarée ;
- [ ] copie binaire exacte archivée dans le dépôt ;
- [ ] reconstruction réussie ;
- [ ] taille reconstruite égale à `112477` octets ;
- [ ] SHA-256 reconstruit conforme.
