# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY_WITH_EXTERNAL_CI_BLOCKER`  
> **Boucles :** `LOOP-DEV-001` + `LOOP-REG-001`  
> **État produit :** `FUNCTIONAL_PRE_COMPLIANCE_PLATFORM_REGULATORY_REVIEW_IN_PROGRESS`  
> **ready_for_submission :** `false`

## Action prioritaire unique

Reprendre **R1 — sanctions 2016 ↔ 2022** avec un objectif documentaire unique :

> **obtenir le binaire officiel ou institutionnel non indexé de la Décision n° CM/10/06/2022 du 24 juin 2022**, puis comparer ses clauses au binaire officiel 2016 déjà matérialisé.

La recherche Web publique répétitive est arrêtée : son périmètre documenté est épuisé sans binaire. Le prochain mode d’acquisition est `INSTITUTIONAL_NON_INDEXED_DOCUMENT_RECOVERY`.

### Décision sanctions 2016 — acquisition fermée

- source : `DECISION_CM_SJ_001_03_2016` ;
- PDF : `regulatory/sources/amf-umoa-priority-api-documents/DECISION_SANCTIONS_2016.pdf` ;
- SHA-256 : `888b971071f32a6453647b979f3f9cc551d686e1bc7135d6a659e8907aa9dbe2` ;
- 12 pages ;
- signée le `2016-03-24` ;
- entrée en vigueur le `2017-01-01` selon l’article 12 ;
- quantums et grilles présents mais **strictement inactifs**.

### Chaîne normative 2016 → 2021 → 2022

- `CM/SJ/O01/03/2016` : binaire acquis ;
- `CM/07/09/2021` : décision d’adoption de la Loi uniforme relative aux infractions boursières identifiée institutionnellement et enregistrée ;
- `CM/10/06/2022` : référence et objet confirmés par la CENTIF Sénégal ; adoption du dispositif révisé le `2022-06-24` confirmée par la BCEAO ; binaire encore manquant.

Fichiers principaux :

- `regulatory/sources/DECISION_CM_SJ_001_03_2016.yaml` ;
- `regulatory/sources/DECISION_CM_07_09_2021_UNIFORM_SECURITIES_OFFENCES_LAW.yaml` ;
- `regulatory/sources/DECISION_CM_10_06_2022.yaml` ;
- `regulatory/review-evidence/SANCTIONS_2016_2022/SANCTIONS_NORMATIVE_CHAIN_2016_2021_2022_2026-08-08.yaml` ;
- `regulatory/review-evidence/SANCTIONS_2016_2022/OFFICIAL_BINARY_SEARCH_2026-08-08.yaml` ;
- `regulatory/review-evidence/SANCTIONS_2016_2022/PUBLIC_BINARY_SEARCH_BOUNDARY_2026-08-08.yaml`.

### Routes institutionnelles prioritaires pour 2022

1. pièce jointe ou archive documentaire CENTIF Sénégal ;
2. archive du Conseil des Ministres de l’UMOA / BCEAO ;
3. archive AMF-UMOA / CREPMF non exposée dans la catégorie courante `Decision` ;
4. E-DOCUCENTER ou dépôt institutionnel UEMOA non indexé ;
5. archive gouvernementale d’un État membre non indexée par les moteurs publics.

### Lecture obligatoire dès acquisition du binaire 2022

- référence complète et bloc de signature ;
- date d’effet ;
- clause d’abrogation / modification / remplacement ;
- dispositions transitoires ;
- annexe 1 : classification des manquements ;
- annexe 2 : quantums de sanctions ;
- relation avec `CM/SJ/O01/03/2016` ;
- relation avec `CM/07/09/2021` et la Loi uniforme relative aux infractions boursières.

Aucun montant ou barème sanctions ne doit être activé avant cette comparaison et les revues juridique/conformité.

---

## R3 — Article 92 de l’Instruction 66

État courant : **7 références historiques, 6 routes officielles identifiées, 1 route manquante**.

- Instruction 46/2011 révisée : binaire officiel déjà matérialisé et hashé ;
- Instruction 45/2011 : route AMF-UMOA `actualiteId=1000090` ;
- Instruction 24/99 : `actualiteId=1000070` ;
- Instruction 23/99 : `actualiteId=1000069` ;
- Instruction 22/99 : `actualiteId=1000068` ;
- Instruction 21/99 : `actualiteId=1000067` ;
- Décision 2012-119 : **route officielle encore non identifiée**.

Le champ portail `abroge=false` observé sur certains textes historiques ne peut jamais les réactiver : l’article 92 du binaire officiel de l’Instruction 66 constitue la source normative d’abrogation.

Registre : `regulatory/registries/INST066_ABROGATED_TEXTS_INVENTORY_V0_1.yaml`.

Le matérialiseur batch de reprise est préparé : `scripts/materialize_amf_umoa_pending_api_backfill.py`.

---

## Article 5 — frais d’agrément

Instruction 64/2020 couvre les délais et étapes de traitement des dossiers, mais aucune occurrence de `frais` / `frais d’agrément` n’a été trouvée dans son texte pour le délai de règlement.

Deux sources institutionnelles candidates sont maintenant enregistrées :

- **Instruction n°54/2017 révisée**, `actualiteId=1000098` : facturation, paiement et recouvrement des redevances, frais et commissions ;
- **Décision n° CM/13/12/2011**, `actualiteId=1000178` : fixation des tarifs du Conseil Régional.

Le modèle de preuve à vérifier est :

`Décision du Conseil des Ministres → montant/tarif`  
`Instruction du Conseil Régional → modalités/délai de paiement`

Ce rapprochement reste un candidat documentaire. Les binaires doivent être matérialisés et comparés avant toute résolution ou activation.

Les frais initiaux d’agrément, redevances annuelles, frais de contrôle et commissions doivent rester des catégories séparées.

---

## R4 — Circulaires d’application de l’Instruction 66

La série AMF-UMOA 01–16/2022 est entièrement acquise :

- `16/16` objets API officiels ;
- `16/16` PDF décodés depuis le champ Base64 `doc` ;
- hashes, pagination et texte/OCR conservés.

Revue curatée des `34` renvois `COUNCIL_CIRCULAR` :

- `26` correspondances de contenu fortes ou exactes ;
- `2` relations partielles ;
- `6` sans correspondance démontrée dans la seule série 2022 ;
- `0` dépendance passée à `resolved=true` ;
- `0` exigence activée.

Les six résidus restent à rechercher dans le corpus complet des circulaires AMF-UMOA :

1. limites des services auxiliaires des SGO ;
2. délégation / interdiction de devenir une « boîte aux lettres » ;
3. règle SICAV / admission au marché ;
4. délégation du portefeuille global de la SICAV ;
5. rapport annuel du Conseil de Surveillance FCPE ;
6. rapport annuel du Conseil de Surveillance SICAVAS.

---

## Produit / frontend — état à préserver

Le produit est déjà une plateforme de pré-conformité fonctionnelle :

- application Next.js sous `apps/web` ;
- App Router + React + TypeScript ;
- Atomic Design ;
- création/versionnement des projets ;
- questionnaire réglementaire dynamique ;
- dix collections canoniques structurées ;
- contrôles ;
- aperçu ;
- génération déterministe ;
- espace de revue humaine ;
- API projets/questions/réponses/génération/revues/workflow/catalogue ;
- dépôt PostgreSQL transactionnel multi-tenant implémenté et testé ;
- OIDC/RBAC côté serveur préparé ;
- stockage de preuves avec quarantaine préparé.

Restent notamment à industrialiser : activation PostgreSQL réelle, fournisseur d’identité réel, stockage objet/antivirus réels, bibliothèque réglementaire administrable, administration des clauses, tests navigateur/accessibilité, PDF réglementaire final, import de prospectus, comparaison de versions, environnements et déploiement.

---

## Blocage GitHub Actions

Le workflow récent de validation machine n’a **pas démarré**. GitHub a indiqué que des paiements récents du compte avaient échoué ou que la limite de dépense devait être augmentée.

Preuve : `regulatory/validation/GITHUB_ACTIONS_BILLING_BLOCKER_2026-08-08.yaml`.

Conséquences :

- ne pas déclarer les workflows récents `PASS` ;
- ne pas les déclarer comme échecs de code ;
- les CI antérieures validées restent des preuves historiques de l’état antérieur ;
- après rétablissement : exécuter le backfill AMF-UMOA, revalider la matrice 34=26+2+6, puis relancer `Regulatory CI` et `Security & Review Policy CI`.

## Invariants

- `candidate_match_is_resolution=false` ;
- `content_scope_match_is_legal_resolution=false` ;
- `binary_materialization_is_resolution=false` ;
- `automatic_dependency_resolution_allowed=false` ;
- `automatic_rule_reconstruction_allowed=false` ;
- `automatic_requirement_activation_allowed=false` ;
- `sanction_amount_calculation_allowed=false` tant que 2022 n’est pas comparé ;
- aucune substitution d’un type d’instrument par un autre ;
- aucune métadonnée technique de portail ne peut réactiver un texte explicitement abrogé par un acte normatif ;
- revue juridique, conformité et fiscale humaines obligatoires lorsque requises ;
- `ready_for_submission=false`.
