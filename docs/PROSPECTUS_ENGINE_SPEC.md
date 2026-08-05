# Spécification fonctionnelle — Prospectus Composer UMOA

## 1. Finalité

Le module permet à une société de gestion de construire un prospectus FCP/OPCVM UMOA complet en répondant à un questionnaire simple et progressif.

La société de gestion ne doit pas connaître l’ordre de la circulaire, les répétitions documentaires, les clauses standard ni les dépendances réglementaires. Elle doit seulement confirmer les données connues et prendre les décisions propres au fonds.

## 2. Résultat attendu

À partir des réponses, le système doit produire :

- prospectus DOCX ;
- prospectus PDF ;
- table de concordance ;
- rapport de complétude ;
- rapport des contrôles ;
- journal de modifications ;
- dossier de preuves ;
- manifeste de génération ;
- JSON canonique.

Les documents complémentaires suivants seront dérivés ultérieurement du même modèle :

- DICI ;
- règlement ;
- bulletins de souscription et rachat ;
- fiche produit ;
- fiche internet ;
- exports Openfunds.

## 3. Modes d’entrée

### 3.1 Nouveau prospectus

- profil de la société prérempli ;
- questionnaire du fonds vierge ;
- clauses proposées en fonction des choix.

### 3.2 Dupliquer un fonds

- copie contrôlée des paramètres communs ;
- nouvelle identité ;
- confirmation de chaque bloc sensible ;
- aucune copie aveugle des agréments ou preuves propres au fonds source.

### 3.3 Importer un prospectus existant

- conservation de l’original ;
- extraction des informations ;
- association aux champs canoniques ;
- provenance page/zone ;
- score de confiance ;
- confirmation utilisateur ;
- identification des éléments manquants.

### 3.4 Mettre à jour un prospectus publié

- chargement du snapshot antérieur ;
- comparaison des données ;
- comparaison des versions réglementaires ;
- questionnaire limité aux écarts ;
- diff documentaire ;
- nouvelle version sans écraser l’ancienne.

## 4. Profil permanent de la société de gestion

Le profil contient :

- dénomination et historique ;
- forme juridique ;
- RCCM ;
- date de constitution ;
- agrément ;
- siège statutaire ;
- administration centrale ;
- capital souscrit ;
- capital libéré ;
- dirigeants ;
- administrateurs ;
- organes de surveillance ;
- activités externes significatives ;
- responsable conformité ;
- responsable risques ;
- responsable contrôle interne ;
- politique de rémunération ;
- politique de conflits d’intérêts ;
- dépositaires habituels ;
- commissaires aux comptes ;
- conseillers ;
- autres OPC gérés ;
- coordonnées ;
- justificatifs.

Au démarrage du projet, le module demande :

> Les informations institutionnelles affichées sont-elles toujours exactes ?

Les informations modifiées sont soumises à vérification et datées.

## 5. Parcours du questionnaire

### Étape 1 — Projet et statut

Questions principales :

- type de document ;
- nouveau fonds ou fonds existant ;
- forme du produit ;
- pays de constitution ;
- statut du projet ;
- date envisagée de dépôt ;
- agrément obtenu ou en cours ;
- visa obtenu ou en cours.

Effets :

- sélection du pack ;
- sélection de la version réglementaire ;
- activation du parcours nouveau/import/mise à jour ;
- définition des pièces attendues.

### Étape 2 — Identité et durée

- dénomination officielle ;
- nom commercial ;
- anciennes dénominations ;
- date de constitution ;
- durée déterminée ou indéterminée ;
- date d’expiration ;
- prorogation ;
- date de clôture ;
- devise comptable ;
- numéro et date d’agrément ;
- numéro de visa du prospectus.

### Étape 3 — Parts et classes

Question d’entrée :

> Le fonds comporte-t-il plusieurs classes de parts ?

Pour chaque classe :

- nom et code ;
- devise ;
- capitalisation ou distribution ;
- souscripteurs ;
- valeur liquidative d’origine ;
- minimum initial ;
- minimum ultérieur ;
- fractionnement ;
- décimales ;
- couverture de change ;
- frais spécifiques ;
- ISIN éventuel ;
- cotation ou négociation éventuelle.

Caractéristiques juridiques :

- nature du droit ;
- dématérialisation ;
- titres ou certificats ;
- registre ou compte ;
- teneur de registre ;
- nominatif ou porteur ;
- coupons ;
- droits de vote ;
- droits en liquidation.

### Étape 4 — Acteurs

Sélection ou création contrôlée :

- société de gestion ;
- dépositaire ;
- conservateur ;
- centralisateur ;
- teneur de passif ;
- commissaire aux comptes titulaire ;
- commissaire aux comptes suppléant ;
- personnes chargées du contrôle des données comptables ;
- délégataires ;
- conseiller externe ;
- distributeurs ;
- agents payeurs.

Pour chaque délégation :

- fonction ;
- périmètre ;
- contrat ;
- date ;
- contrôle ;
- responsabilité maintenue ;
- conflits d’intérêts ;
- preuve.

### Étape 5 — Classification, objectif et stratégie

#### Classification

- monétaire ;
- obligataire ;
- actions ;
- diversifié ;
- fonds de fonds ;
- autre catégorie autorisée.

#### Objectif

Choix guidés :

- préservation du capital ;
- revenu ;
- croissance ;
- revenu et croissance ;
- surperformance ;
- réplication ;
- autre objectif spécifique.

Données :

- horizon ;
- garantie ;
- protection ;
- rendement garanti ou non ;
- indicateur de référence ;
- usage de l’indicateur ;
- liberté par rapport à l’indicateur.

#### Style

- actif discrétionnaire ;
- indiciel ;
- systématique ;
- quantitatif ;
- passif ;
- mixte.

#### Zones et secteurs

- États ;
- régions ;
- secteurs ;
- exclusions ;
- devises ;
- marchés réglementés ou non.

### Étape 6 — Catégories d’actifs et limites

Matrice :

```text
Catégorie
Utilisée
Minimum
Maximum
Sous-limites
Émetteurs
Marchés
Devises
Qualité de crédit
Maturité
Méthode de valorisation
```

Catégories initiales :

- actions cotées ;
- actions non cotées ;
- obligations souveraines ;
- obligations d’entreprises ;
- titres monétaires ;
- dépôts ;
- liquidités ;
- OPC ;
- titres étrangers ;
- dérivés ;
- autres actifs.

Contrôles :

- minimum inférieur ou égal au maximum ;
- valeurs entre 0 et 100 % ;
- somme des minima possible ;
- catégorie du fonds cohérente ;
- ratios applicables ;
- risques présents ;
- valorisation présente.

### Étape 7 — Risques

Risques proposés automatiquement selon les choix :

- perte en capital ;
- marché ;
- actions ;
- taux ;
- crédit ;
- défaut ;
- liquidité ;
- change ;
- contrepartie ;
- opérationnel ;
- gestion discrétionnaire ;
- concentration ;
- valorisation ;
- dérivés ;
- levier ;
- autres risques spécifiques.

Pour chaque risque :

- applicable ;
- niveau de matérialité ;
- justification ;
- mesure de maîtrise ;
- version courte ;
- version complète ;
- ordre de présentation.

Le système interdit la suppression non justifiée d’un risque déclenché par une exposition importante.

### Étape 8 — Valeur liquidative et prix

- fréquence ;
- jour ;
- heure ;
- fuseau ;
- date de référence ;
- calendrier ;
- sources de prix ;
- responsable ;
- publication ;
- lieux ;
- canaux ;
- fréquence de publication ;
- délai de communication.

Distinguer :

- valeur liquidative ;
- prix d’émission ;
- prix de vente ;
- prix de souscription ;
- prix de rachat ;
- prix de remboursement ;
- frais ajoutés ou déduits.

### Étape 9 — Souscription, émission et vente

- période initiale ;
- prix initial ;
- quantités ;
- souscripteurs admissibles ;
- lieux ;
- distributeurs ;
- documents ;
- paiement ;
- apports en nature ;
- centralisation ;
- cut-off ;
- VL applicable ;
- suspension.

### Étape 10 — Rachat, remboursement et liquidité

- canaux ;
- cut-off ;
- VL ;
- frais ;
- délai normal ;
- délai exceptionnel ;
- minimum ;
- préavis ;
- règlement ;
- jours fériés ;
- suspension ;
- plafonnement ;
- report ;
- information ;
- notification au régulateur ;
- reprise.

### Étape 11 — Revenus et distributions

- capitalisation ;
- distribution ;
- politique par classe ;
- méthode de détermination ;
- revenu distribuable ;
- décision ;
- fréquence ;
- détachement ;
- paiement ;
- réserves ;
- distribution exceptionnelle.

### Étape 12 — Frais, dépenses et rémunérations

Catalogue initial :

- souscription acquise au fonds ;
- souscription non acquise ;
- rachat acquis au fonds ;
- rachat non acquis ;
- gestion financière ;
- administration ;
- dépositaire ;
- conservation ;
- distribution ;
- régulateur ;
- CAC ;
- performance ;
- frais indirects ;
- conseil ;
- autres dépenses ;
- remboursements de frais.

Pour chaque ligne :

- payeur ;
- bénéficiaire ;
- assiette ;
- taux ;
- montant ;
- minimum ;
- maximum ;
- fréquence ;
- taxes ;
- classe ;
- conditions d’exonération ;
- preuve.

Ventilation obligatoire :

- supporté directement par le porteur ;
- prélevé sur l’actif du fonds ;
- supporté par la société de gestion ;
- autre.

### Étape 13 — Valorisation

Pour chaque actif utilisé :

- source principale ;
- source secondaire ;
- méthode de repli ;
- juste valeur ;
- méthode actuarielle ;
- taux d’actualisation ;
- intérêts courus ;
- taux de change ;
- prix périmé ;
- comité ;
- conflit d’intérêts ;
- fréquence ;
- validation.

### Étape 14 — Fiscalité

- régime du fonds ;
- régime général des porteurs ;
- retenue sur revenus ;
- retenue sur gains ;
- résidents ;
- non-résidents ;
- avertissement ;
- source ;
- date de validité ;
- revue fiscale.

Aucun taux fiscal ne doit être inventé ou généré sans source validée.

### Étape 15 — Commercialisation par État

Sélection des États de commercialisation.

Pour chaque État :

- autorisation ;
- date ;
- distributeur ;
- agent payeur ;
- points de souscription ;
- points de rachat ;
- moyens de paiement ;
- lieux d’information ;
- site ;
- contacts ;
- langue ;
- mentions locales ;
- annexes.

### Étape 16 — Performances et informations économiques

Performances :

- historique disponible ;
- date de lancement ;
- rendements calendaires ;
- benchmark ;
- méthode ;
- frais inclus ;
- distributions réinvesties ;
- devise ;
- source ;
- audit ;
- prospectus ou annexe.

Informations économiques :

- applicabilité ;
- contenu ;
- source ;
- date ;
- validation juridique.

La notion d’« informations d’ordre économique » doit rester soumise à interprétation validée tant que les textes complémentaires n’ont pas été étudiés.

### Étape 17 — Investisseur-type

- personnes physiques ou morales ;
- particuliers ou institutionnels ;
- connaissances ;
- expérience ;
- tolérance au risque ;
- capacité de perte ;
- horizon ;
- besoin de liquidité ;
- objectifs ;
- investisseurs incompatibles.

### Étape 18 — Documents et preuves

- règlement ;
- agrément SGO ;
- agrément fonds ;
- visa ;
- statuts ;
- RCCM ;
- conventions ;
- mandats ;
- politiques ;
- méthodes de valorisation ;
- grille de frais ;
- décisions ;
- preuves pays.

### Étape 19 — Contrôles et revue

Tableau de préparation :

```text
Complétude des données
Pièces reçues
Contrôles réussis
Avertissements
Blocages
Sections validées
Clauses spécifiques
```

La formulation « conforme à X % » est interdite. Afficher plutôt :

> X % des exigences configurées ont été renseignées et ont passé les contrôles automatisés. Les points restants nécessitent correction ou validation humaine.

## 6. Modèle d’une question

```yaml
question_id: Q_INVESTMENT_CATEGORY
field_ids:
  - fund.classification
label: Quelle est la catégorie principale du fonds ?
type: SINGLE_CHOICE
required: true
options:
  - value: MONEY_MARKET
    label: Fonds monétaire
  - value: BOND
    label: Fonds obligataire
  - value: EQUITY
    label: Fonds actions
  - value: BALANCED
    label: Fonds diversifié
show_if: true
effects:
  - activate_rule_set: CLASSIFICATION_RULES
  - activate_question_group: ASSET_ALLOCATION
  - select_clause_group: CLASSIFICATION_WORDINGS
review_role: COMPLIANCE
```

## 7. Modèle d’une clause

```yaml
clause_id: UMOA_FCP_NO_CAPITAL_GUARANTEE
version: 1
category: LOCKED_REGULATORY
jurisdiction: UMOA
product_type: FCP
section_id: RISK_PROFILE
status: DRAFT
effective_from: null
requirements: []
conditions:
  all:
    - field: capital_protection.guaranteed
      operator: equals
      value: false
variables: []
wording: >
  Le Fonds ne bénéficie d’aucune garantie ou protection du capital.
  Le montant initialement investi peut ne pas être intégralement restitué.
review_roles:
  - LEGAL
  - COMPLIANCE
```

Aucune clause ne devient `ACTIVE` sans source, revue et validation.

## 8. Modèle d’une règle

```yaml
rule_id: RULE_ASSET_RANGE_VALIDITY
severity: BLOCKER
scope: AssetExposureRange
assertions:
  - minimum_percent >= 0
  - maximum_percent <= 100
  - minimum_percent <= maximum_percent
message: >
  Les bornes d’exposition doivent être comprises entre 0 et 100 %,
  et la borne minimale ne peut pas dépasser la borne maximale.
```

## 9. Structure documentaire réglementaire

### Couverture

- logo ;
- SGO ;
- dénomination ;
- type ;
- statut ;
- date ;
- avertissement ;
- numéro d’agrément ou visa selon le statut réel.

### Partie 1 — FCP et société de gestion

#### FCP

1. dénomination ;
2. constitution et durée ;
3. documents disponibles ;
4. fiscalité ;
5. clôture et distributions ;
6. contrôle des données comptables ;
7. nature et caractéristiques des parts ;
8. cotation ;
9. émission et vente ;
10. rachat et remboursement ;
11. suspension ;
12. revenus ;
13. objectifs ;
14. politique et limites ;
15. techniques et emprunts ;
16. valorisation ;
17. prix ;
18. rémunérations et remboursements de frais.

#### Société de gestion

- identité ;
- forme ;
- RCCM ;
- sièges ;
- constitution ;
- agrément ;
- autres OPC ;
- gouvernance ;
- activités externes ;
- capital souscrit et libéré ;
- contrôle interne ;
- risques ;
- rémunération.

### Partie 2 — Dépositaire

- identité ;
- forme ;
- sièges ;
- activité ;
- agrément ;
- missions ;
- garde ;
- délégations ;
- conflits.

### Partie 3 — Conseillers externes

- identité ;
- mission ;
- clauses importantes ;
- autres activités ;
- conflits.

### Partie 4 — Paiements, rachats et diffusion

- État d’établissement ;
- autres États ;
- points de souscription ;
- points de rachat ;
- agents payeurs ;
- accès à l’information ;
- publication des prix.

### Partie 5 — Autres informations

- performances ;
- investisseur-type ;
- informations économiques ;
- autres dépenses.

## 10. Workflow

```text
DRAFT
→ DATA_INCOMPLETE
→ DATA_COMPLETE
→ VALIDATION_FAILED
→ READY_FOR_COMPLIANCE_REVIEW
→ COMPLIANCE_REVIEWED
→ READY_FOR_LEGAL_REVIEW
→ LEGAL_REVIEWED
→ MANAGEMENT_APPROVED
→ READY_FOR_SUBMISSION
→ SUBMITTED
→ REGULATOR_COMMENTS_RECEIVED
→ AMENDMENT_IN_PROGRESS
→ APPROVED_OR_VISA_GRANTED
→ PUBLISHED
→ SUPERSEDED
```

## 11. Traçabilité

Chaque composant généré conserve :

- identifiant de paragraphe ;
- clause et version ;
- variables ;
- champs sources ;
- réponses ;
- exigences ;
- preuves ;
- pack ;
- modèle ;
- date ;
- statut de revue ;
- modifications manuelles.

## 12. Modifications manuelles

Catégories :

- texte verrouillé : non modifiable ;
- variable : modification dans le formulaire source ;
- clause paramétrique : modification contrôlée ;
- texte spécifique : suivi des modifications et revue ;
- mise en forme : autorisée dans les limites du modèle.

Une modification directe d’un texte réglementaire doit :

- conserver l’ancienne version ;
- enregistrer l’auteur et la raison ;
- signaler l’écart à la clause ;
- relancer les contrôles ;
- imposer une revue.

## 13. Rôle de l’IA

Autorisé :

- extraction ;
- classement ;
- reformulation ;
- comparaison ;
- détection d’incohérences ;
- suggestion de risques ;
- explication utilisateur ;
- proposition de rédaction spécifique.

Non autorisé sans validation :

- création d’une règle normative ;
- décision de dispense ;
- validation d’agrément ;
- taux fiscal ;
- classification litigieuse ;
- suppression d’une obligation ;
- déclaration de conformité finale.

## 14. Critères d’acceptation V1

Un cas FCP standard est accepté lorsque :

- les exigences configurées sont toutes couvertes ou justifiées ;
- aucun blocage ne reste ouvert ;
- les données ont une provenance ;
- les clauses sont approuvées ou marquées pour revue ;
- l’ordre réglementaire est respecté ;
- les tableaux sont cohérents ;
- le DOCX et le PDF sont générés ;
- la table de concordance est générée ;
- le snapshot est reproductible ;
- les validations humaines requises sont enregistrées ;
- le document n’est pas présenté comme approuvé avant décision du régulateur.

<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:START -->
## Entrée web canonique du moteur documentaire

Chaque génération depuis l’application produit un `canonical-snapshot.json` contenant l’empreinte du catalogue, les chemins canoniques, les réponses, les exigences, les statuts de revue, les contrôles et les éléments historiques non mappés.

Ce snapshot devient le contrat d’entrée de la prochaine tranche du compositeur. Il ne peut jamais porter `readyForSubmission: true` sans workflow humain distinct.
<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:END -->
