# STATUS — État courant du projet

> **Statut :** `APPLICABLE`  
> **Photographie au :** 2026-08-05  
> **Référence de boucle :** `LOOP-GOV-001` — `CLOSED`.

## Terminé

- cadrage OPCVM/FCP UMOA ;
- gouvernance initiale et décisions `DEC-001` à `DEC-014` ;
- mapping machine-readable initial de la Circulaire n°05/CREPMF/2022 ;
- `62` exigences V1, quatre matrices CSV et `30` objets canoniques ;
- audit du dépôt au commit de départ `7433be04ce00d0108c1e01441d5e49f01fb994f4` ;
- lecture du kit Loop Engineering version `1.0.0`, de ses `176` fichiers Markdown et de son manifeste ;
- intégration additive de tous les `176/176` chemins Markdown du kit ;
- création des adaptateurs, registres d’état, modèles et sept ADR de gouvernance ;
- enregistrement du nom, de la taille et du SHA-256 du ZIP source ;
- contrôle de présence des chemins, des comptes de fichiers et de la préservation des artefacts réglementaires ;
- clôture de `TASK-GOV-001 — Intégrer le standard documentaire Loop Engineering sans régression`.

## État documentaire vérifié

- fichiers Markdown avant la boucle : `11` ;
- fichiers Markdown après la création initiale : `194` ;
- fichiers créés depuis le commit de départ lors de l’intégration initiale : `192`, dont `183` Markdown et `9` fragments Base64 historiques ;
- documents canoniques historiques maintenus : `README.md`, `AGENTS.md`, `SUIVI.md`, `TODO.md`, `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/PROSPECTUS_ENGINE_SPEC.md`, `docs/REGULATORY_MAPPING.md` ;
- branche conservée : `main` ;
- aucune autre branche présente au contrôle préparatoire ;
- aucun déploiement, aucune fusion, aucune migration et aucune modification de données de production.

## Anomalie déclarée — archive binaire du kit

Les neuf fragments Base64 sous `docs/kits/parts/` ne permettent pas de reconstruire fidèlement le ZIP source : `9` parties et `164786` caractères sont présents, alors que `13` parties et `149972` caractères sont attendus. Ils sont conservés comme traces historiques, exclus de la source de vérité et marqués `INVALID_UNVERIFIED_LEGACY_FRAGMENTS`.

L’intégration des contenus Markdown reste complète : `176/176` chemins présents, aucun fichier vide et aucun fichier limité à un titre. La copie binaire exacte du ZIP n’est pas archivée dans le dépôt.

## Bloqué ou non vérifié

- date officielle de publication et état juridique actuel de la Circulaire n°05/CREPMF/2022 ;
- copie source officielle et version actuelle de l’Instruction n°66/CREPMF/2021 ;
- responsables métier, conformité, juridique, fiscal, technique et sécurité ;
- stack, environnements, base, build, tests et déploiement ;
- validation juridique et conformité des clauses et mappings ;
- copie binaire exacte du kit dans GitHub, si cette conservation devient nécessaire ;
- crawler automatisé complet de tous les liens Markdown et scanner de secrets dédié.

## Risques immédiats

- confusion entre documents canoniques et adaptateurs ;
- utilisation d’un module `À DÉTERMINER` comme procédure réelle ;
- duplication de wordings juridiques non approuvés ;
- dérive entre Markdown et artefacts machine-readable ;
- interprétation d’une validation structurelle comme une validation juridique ;
- utilisation erronée des fragments Base64 comme archive source.

## Prochaine action unique

Voir `NEXT_ACTION.md` : obtenir une copie officielle, vérifiable et exploitable de l’Instruction n°66/CREPMF/2021 avant toute atomisation.
