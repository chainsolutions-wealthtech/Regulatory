# MASTER COMPLETION PLAN — 8 étapes jusqu'à clôture du produit

> **Date de référence :** 2026-08-08  
> **Branche :** `main`  
> **Boucles :** `LOOP-DEV-001` + `LOOP-REG-001`  
> **État produit :** `FUNCTIONAL_PRE_COMPLIANCE_PLATFORM_REGULATORY_REVIEW_IN_PROGRESS`  
> **ready_for_submission :** `false`  
> **Règle :** une étape n'est `DONE` que si tous ses critères de sortie sont prouvés. Un blocage externe n'est ni un `PASS`, ni un échec de code.

## Objectif de clôture

Transformer la plateforme existante de pré-conformité en produit réglementaire industrialisé, traçable, testé et exploitable, sans activer une règle, un barème ou une soumission sur la base d'une simple extraction, d'un rapprochement documentaire ou d'une hypothèse.

Le chemin directeur est :

`CI → corpus → dépendances → revue humaine → activation contrôlée → industrialisation → livrables → recette/production`

---

## Étape 1 — Rétablir et fermer la chaîne CI

**État :** `BLOCKED_EXTERNAL_GITHUB_BILLING`.

### Déjà fait

- les CI Regulatory et Security avaient déjà validé le socle précédent ;
- la protection de `NEXT_ACTION.md` contre les générateurs historiques est en place ;
- le blocage actuel est documenté dans `regulatory/validation/GITHUB_ACTIONS_BILLING_BLOCKER_2026-08-08.yaml` ;
- le dernier job observé est créé mais exécute `0` étape, ce qui ne constitue pas un échec de code.

### Reste

- rétablir la facturation ou la spending limit GitHub Actions au niveau du compte/organisation ;
- relancer la matrice de portée des circulaires ;
- exécuter le backfill AMF-UMOA préparé ;
- relancer `Regulatory CI` ;
- relancer `Security and Review Policy CI` ;
- contrôler les artefacts, hashes et invariants générés.

### Critères de sortie

- runners GitHub démarrent réellement ;
- toutes les étapes attendues sont exécutées ;
- Regulatory CI = `PASS` sur la tête courante ;
- Security and Review Policy CI = `PASS` sur la tête courante ;
- matrice 34 renvois circulaires : `34 = 26 + 2 + 6`, avec `resolved=false` partout avant revue humaine ;
- `ready_for_submission=false` reste verrouillé.

---

## Étape 2 — Terminer le corpus réglementaire bloquant

**État :** `IN_PROGRESS_WITH_EXTERNAL_DOCUMENT_BLOCKERS`.

### Déjà fait

- CIRC005 : 62 exigences structurées ;
- Instruction 66 : source officielle, 65 pages, articles 1–92, 111 exigences candidates ;
- Instruction 58 : source officielle, 17 pages, articles 1–35, 32 exigences candidates ;
- Circulaires AMF-UMOA 01–16/2022 : 16/16 objets + 16/16 PDF matérialisés ;
- Instruction 61/2020 : binaire officiel acquis ;
- Instruction 64/2020 : binaire officiel acquis ;
- Décision sanctions 2016 : binaire officiel acquis ;
- Article 92 Instruction 66 : 6 routes officielles sur 7 identifiées ;
- Instruction 54/2017 révisée et Décision CM/13/12/2011 : routes institutionnelles identifiées ;
- Décision CM/07/09/2021 : identifiée comme maillon de la chaîne sanctions.

### Verrous restant

- obtenir le binaire institutionnel de `CM/10/06/2022` ;
- retrouver la route officielle de la Décision `2012-119` ;
- matérialiser les anciens textes Article 92 déjà localisés : 45/2011, 24/99, 23/99, 22/99, 21/99 ;
- matérialiser Instruction 54/2017 révisée ;
- matérialiser Décision CM/13/12/2011 ;
- matérialiser Décision CM/07/09/2021 ;
- fermer les modificatifs/rectificatifs pertinents ;
- documenter la version courante du référentiel comptable.

### Critères de sortie

- chaque dépendance bloquante possède soit un binaire institutionnel matérialisé/hashé, soit un blocage externe officiellement documenté et non contournable ;
- la relation juridique 2016 ↔ 2022 sanctions est établie sur les textes officiels ;
- aucun barème sanctions n'est activé avant cette comparaison ;
- l'historique Article 92 est traçable 7/7 ;
- aucune copie tierce n'est utilisée comme source normative.

---

## Étape 3 — Fermer les dépendances de l'Instruction 66

**État :** `ADVANCED_NOT_CLOSED`.

### Déjà fait

- 49 occurrences de dépendances externes inventoriées sur 26 articles ;
- 34 renvois `COUNCIL_CIRCULAR` isolés ;
- série 01–16/2022 matérialisée ;
- revue curatée : 26 correspondances fortes/exactes, 2 partielles, 6 sans correspondance démontrée dans cette série ;
- 7 renvois `COUNCIL_INSTRUCTION` identifiés ;
- 5 dépendances comptables identifiées ;
- Instruction 64 couvre fortement plusieurs renvois procéduraux ;
- Instruction 54/2017 révisée + Décision tarifaire 2011 identifiées comme paire candidate pour frais/paiement.

### Reste

- retrouver les 6 circulaires/règles résiduelles hors série 2022 ;
- fermer les 2 correspondances seulement partielles ;
- matérialiser et vérifier les candidats Instructions/Décisions encore non acquis ;
- fermer les 5 dépendances comptables sur la version juridiquement applicable ;
- établir pour chaque dépendance : source, citation, portée, date d'effet, statut, version et preuve.

### Critères de sortie

- chaque dépendance externe a un statut final : `MATCHED_AND_REVIEWED`, `NOT_APPLICABLE_WITH_JUSTIFICATION`, ou `BLOCKED_BY_IDENTIFIED_EXTERNAL_SOURCE_GAP` ;
- aucun rapprochement lexical seul n'est considéré comme résolution ;
- aucune substitution de type d'instrument ;
- toutes les dépendances disposent d'une provenance et d'une preuve révisable.

---

## Étape 4 — Réaliser la revue humaine réglementaire

**État :** `BLOCKING_FOR_ACTIVATION`.

### Périmètre minimal

- 111 exigences candidates Instruction 66 ;
- 32 exigences candidates Instruction 58 ;
- clauses et wordings ;
- seuils, ratios, délais, exemptions, exceptions et applicabilités ;
- sanctions 2016/2022 ;
- fiscalité ;
- correspondances CIRC005 ↔ INST066 ↔ INST058 ↔ circulaires/décisions/instructions.

### Rôles attendus

- Juridique ;
- Conformité ;
- Fiscal lorsque nécessaire ;
- Risques / Produit lorsque nécessaire ;
- approbateur final distinct si séparation des tâches configurée.

### Critères de sortie

- chaque exigence destinée au moteur a une décision humaine traçable ;
- chaque clause activable possède une version approuvée ;
- les éléments rejetés ou partiels restent explicitement non actifs ;
- aucune auto-approbation ;
- aucune exigence `PENDING` utilisée comme règle bloquante de production.

> Cette étape comporte une dépendance humaine réelle : l'agent peut préparer, vérifier, présenter et enregistrer les preuves, mais ne peut se substituer à la validation juridique/conformité des responsables désignés.

---

## Étape 5 — Connecter uniquement les règles validées au moteur

**État :** `PARTIALLY_IMPLEMENTED_ACTIVATION_GATED`.

### Déjà fait

- moteur réglementaire déterministe ;
- catalogue web ;
- questionnaire dynamique ;
- règles/contrôles ;
- couverture ;
- concordance ;
- `ready_for_submission=false` verrouillé ;
- modèle canonique et versionnement disponibles.

### Reste

- introduire un mécanisme d'activation/version de pack réglementaire basé exclusivement sur les validations humaines ;
- isoler `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `ACTIVE`, `SUPERSEDED` ;
- gérer dates d'effet et migrations réglementaires ;
- garantir qu'une nouvelle version de texte n'altère pas rétroactivement un snapshot gelé ;
- tests de non-régression réglementaire par pack/version.

### Critères de sortie

- aucune règle active sans approbation ;
- pack réglementaire versionné et daté ;
- reproductibilité complète d'un document ancien ;
- migrations réglementaires testées ;
- rollback et audit possibles.

---

## Étape 6 — Industrialiser le frontend/backend existant

**État :** `FUNCTIONAL_FRONTEND_PRE_PRODUCTION`.

### Déjà fait

Application `apps/web` :

- Next.js App Router + React + TypeScript ;
- Atomic Design ;
- dashboard ;
- création/versionnement de projets ;
- questionnaire ;
- 10 collections canoniques structurées ;
- contrôles ;
- aperçu ;
- génération ;
- espace de revue ;
- APIs projets/questions/réponses/génération/revues/workflow/catalogue ;
- repository PostgreSQL transactionnel multi-tenant implémenté et testé ;
- OIDC/RBAC côté serveur implémenté derrière configuration ;
- evidence store/quarantaine préparés.

### Reste

- activer PostgreSQL réel à la place du driver local par défaut ;
- connecter un vrai fournisseur OIDC ;
- multi-tenant/organisations réels ;
- stockage objet réel ;
- antivirus réel ;
- chiffrement, secrets, sauvegardes, restauration ;
- bibliothèque réglementaire administrable ;
- administration des clauses ;
- écrans d'historique/versions/diffs ;
- import prospectus DOCX/PDF `EXTRACTED_UNVERIFIED` ;
- amélioration de l'espace de revue et des permissions ;
- observabilité et erreurs d'exploitation.

### Critères de sortie

- aucun mode prototype requis pour le parcours nominal ;
- authentification et autorisation réelles ;
- isolation tenant testée en environnement cible ;
- preuves binaires sécurisées ;
- administration réglementaire utilisable ;
- aucun secret dans le dépôt ;
- migrations et sauvegardes testées.

---

## Étape 7 — Finaliser les livrables réglementaires

**État :** `DOCX_FUNCTIONAL_FINAL_PACKAGE_NOT_COMPLETE`.

### Déjà fait

- snapshot canonique JSON ;
- Markdown déterministe ;
- modèle documentaire ;
- table de concordance ;
- rapport de contrôles ;
- manifeste ;
- DOCX déterministe ;
- QA visuelle du document de référence.

### Reste

- DOCX de production validé ;
- PDF réglementaire final déterministe ;
- rapport de pré-conformité final ;
- table de concordance finalisée ;
- manifestes/hash de tous les livrables ;
- dossier ZIP de revue/dépôt ;
- versioning et archivage ;
- autres documents issus du même modèle canonique lorsque dans le périmètre approuvé.

### Critères de sortie

- même snapshot + même pack + mêmes versions => mêmes sorties ;
- aucune donnée divergente entre documents ;
- traçabilité champ → source → exigence → clause → document ;
- tous les livrables validés structurellement et visuellement ;
- aucune mention de conformité automatique non justifiée.

---

## Étape 8 — E2E, sécurité, accessibilité, recette et production

**État :** `NOT_PRODUCTION_READY`.

### Reste

- tests E2E navigateur ;
- tests responsive ;
- accessibilité ;
- tests de sécurité applicative ;
- tests RBAC et séparation des tâches en environnement cible ;
- performance et charge ;
- sauvegarde/restauration ;
- observabilité/alerting ;
- procédure incident ;
- recette métier ;
- recette conformité/juridique ;
- configuration des environnements ;
- déploiement contrôlé ;
- décision explicite avant toute capacité de soumission.

### Critères de sortie

- CI complète verte ;
- E2E vert ;
- sécurité et exploitation approuvées ;
- recette métier signée ;
- recette réglementaire signée ;
- plan de reprise testé ;
- production observée sans erreur bloquante ;
- `ready_for_submission` ne peut changer qu'après décision explicite et tracée.

---

## Bloqueurs externes actuellement connus

1. **GitHub Actions billing/spending limit** : empêche l'exécution des jobs récents ; aucune étape du dernier job Regulatory CI n'a démarré.
2. **Décision sanctions CM/10/06/2022** : référence/adoption confirmées institutionnellement, binaire non indexé encore manquant.
3. **Décision 2012-119** : seule route Article 92 encore non identifiée.
4. **Revues humaines juridique/conformité/fiscale** : ne peuvent pas être auto-signées par le système.
5. **Secrets, IdP, stockage objet et paramètres d'infrastructure de production** : doivent être fournis/configurés dans l'environnement cible.

## Règles de non-régression pour toute la clôture

- aucune règle inventée ;
- aucune activation à partir de l'OCR seul ;
- aucune activation à partir d'un score lexical ;
- aucune copie tierce utilisée comme source normative si une source institutionnelle est requise ;
- aucune métadonnée technique de portail ne peut réactiver un texte explicitement abrogé ;
- aucune règle candidate ne devient active sans décision humaine lorsque la revue est requise ;
- `ready_for_submission=false` jusqu'à franchissement explicite du gate final ;
- préserver les identifiants et contrats déjà utilisés ;
- tests et preuves avant modification irréversible ;
- ne jamais recommencer le frontend existant : l'industrialiser.

## Définition globale de DONE

Les 8 étapes sont `DONE` uniquement lorsque :

1. la CI courante est verte ;
2. le corpus bloquant est fermé ou possède des bloqueurs externes officiellement levés ;
3. les dépendances de l'Instruction 66 sont closes ;
4. les validations humaines requises sont enregistrées ;
5. seules les règles approuvées sont actives et versionnées ;
6. l'application existante est industrialisée sur une infrastructure réelle ;
7. les livrables finals sont déterministes, traçables et validés ;
8. E2E, sécurité, accessibilité, exploitation et recette sont validés avant production/soumission.
