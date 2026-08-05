# Mapping réglementaire initial

## 1. Objet

Ce document initialise la cartographie entre la Circulaire n°05/CREPMF/2022 et le futur moteur de prospectus.

Il ne remplace pas une revue juridique du texte ni l’atomisation complète de l’Instruction n°66/CREPMF/2021.

Statuts utilisés :

- `SOURCE_CONFIRMED` : exigence lisible dans la circulaire fournie ;
- `TO_ATOMIZE` : exigence identifiée mais champs, règles et preuves à détailler ;
- `LEGAL_REVIEW_REQUIRED` : interprétation ou périmètre à confirmer ;
- `IMPLEMENTED` : réservé aux exigences implémentées et testées ;
- `VALIDATED` : réservé aux exigences validées par les rôles compétents.

## 2. Source

```yaml
source_id: CIRC005_CREPMF_2022
title: Circulaire n°05/CREPMF/2022 relative au contenu du prospectus des OPC
jurisdiction: UMOA
authority_at_publication: CREPMF
current_authority_name: AMF-UMOA
related_source: INSTRUCTION_66_CREPMF_2021
source_status: TO_VERIFY_IN_OFFICIAL_REGISTRY
```

La circulaire indique que le prospectus contient au moins les renseignements de son annexe 1 et respecte l’ordre de présentation mentionné. Elle précise que les renseignements sont requis lorsqu’ils ne figurent pas dans le règlement de l’OPC ou les documents constitutifs annexés.

## 3. Règles transversales

| ID | Exigence | Statut | Conséquence système |
|---|---|---|---|
| `CIRC005_GENERAL_MINIMUM` | Le prospectus contient au moins les renseignements de l’annexe 1. | SOURCE_CONFIRMED | Contrôle global de complétude. |
| `CIRC005_GENERAL_ORDER` | Le prospectus respecte l’ordre de présentation mentionné. | SOURCE_CONFIRMED | Séquence réglementaire du document. |
| `CIRC005_GENERAL_COVERAGE` | Une information peut être couverte par le règlement ou les documents constitutifs annexés. | SOURCE_CONFIRMED | Statut de couverture et table de concordance. |
| `CIRC005_GENERAL_EFFECTIVE_DATE` | La circulaire prend effet à compter de sa publication. | SOURCE_CONFIRMED | Date exacte à confirmer dans le registre officiel. |

## 4. Partie 1 — Fonds Commun de Placement

### 1.1 Dénomination

```yaml
requirement_id: CIRC005_1_1_FCP_DENOMINATION
status: SOURCE_CONFIRMED
fields:
  - fund.legal_name
questions:
  - Q_FUND_LEGAL_NAME
output_section: SEC_1_1_FCP_DENOMINATION
```

### 1.2 Date de constitution et durée limitée éventuelle

```yaml
requirement_id: CIRC005_1_2_FCP_CONSTITUTION_DURATION
status: SOURCE_CONFIRMED
fields:
  - fund.constitution_date
  - fund.duration_type
  - fund.duration_years
  - fund.expiration_date
questions:
  - Q_FUND_CONSTITUTION_DATE
  - Q_FUND_DURATION_TYPE
output_section: SEC_1_2_FCP_CONSTITUTION_DURATION
```

### 1.4 Lieu d’obtention du règlement et des rapports périodiques

```yaml
requirement_id: CIRC005_1_4_FCP_DOCUMENT_AVAILABILITY
status: SOURCE_CONFIRMED
fields:
  - documents.fund_regulation.is_attached
  - documents.fund_regulation.locations
  - documents.periodic_reports.locations
controls:
  - RULE_DOCUMENT_LOCATION_REQUIRED_IF_NOT_ATTACHED
output_section: SEC_1_4_DOCUMENT_AVAILABILITY
```

### 1.5 Régime fiscal et retenues à la source

```yaml
requirement_id: CIRC005_1_5_FCP_TAX
status: SOURCE_CONFIRMED
fields:
  - tax.fund.summary
  - tax.holders.income_withholding
  - tax.holders.capital_gain_withholding
review_roles:
  - TAX
  - LEGAL
controls:
  - RULE_TAX_SOURCE_REQUIRED
output_section: SEC_1_5_TAX
```

### 1.6 Clôture des comptes et distributions

```yaml
requirement_id: CIRC005_1_6_FCP_CLOSING_DISTRIBUTIONS
status: SOURCE_CONFIRMED
fields:
  - accounting.financial_year_end
  - income.policy
  - income.distribution_dates
output_section: SEC_1_6_CLOSING_DISTRIBUTIONS
```

### 1.7 Personnes chargées du contrôle des données comptables

```yaml
requirement_id: CIRC005_1_7_FCP_ACCOUNTING_CONTROL
status: SOURCE_CONFIRMED
fields:
  - accounting_control.responsible_persons
related_provision: Instruction 66/2021, article 37
controls:
  - RULE_ACCOUNTING_CONTROL_PERSON_REQUIRED
output_section: SEC_1_7_ACCOUNTING_CONTROL
```

### 1.10 Nature et caractéristiques principales des parts

Sous-exigences initiales :

| ID | Contenu | Champs principaux |
|---|---|---|
| `CIRC005_1_10_A_FCP_RIGHT_NATURE` | Nature du droit représenté par la part. | `parts.legal_right_type`, `parts.legal_right_description` |
| `CIRC005_1_10_B_FCP_TITLES_CERTIFICATES` | Titres originaux ou certificats représentatifs ; inscription sur registre ou compte. | `parts.original_titles_exist`, `parts.certificates_exist`, `parts.registration_method`, `parts.register_keeper` |
| `CIRC005_1_10_C_FCP_FORM_COUPONS` | Parts nominatives ou au porteur ; coupons éventuels. | `parts.form`, `parts.coupons_exist`, `parts.coupon_description` |
| `CIRC005_1_10_D_FCP_VOTING` | Droit de vote éventuel. | `parts.voting_rights_exist`, `parts.voting_rights_description` |
| `CIRC005_1_10_E_FCP_LIQUIDATION_RIGHTS` | Circonstances de liquidation et droits des porteurs. | `liquidation.circumstances`, `parts.liquidation_rights` |

Statut : `SOURCE_CONFIRMED`, atomisation détaillée à poursuivre.

### 1.11 Cotation ou négociation des parts

```yaml
requirement_id: CIRC005_1_11_FCP_LISTING
status: SOURCE_CONFIRMED
fields:
  - parts.listed
  - parts.traded
  - parts.market_name
  - parts.ticker
  - parts.isin
output_section: SEC_1_11_LISTING
```

### 1.12 Modalités et conditions d’émission et de vente

```yaml
requirement_id: CIRC005_1_12_FCP_ISSUE_SALE
status: SOURCE_CONFIRMED
fields:
  - parts.issue
  - subscriptions.sales_channels
  - subscriptions.authorized_distributors
output_section: SEC_1_12_ISSUE_SALE
```

### 1.13 Rachat, remboursement et suspension

```yaml
requirement_id: CIRC005_1_13_FCP_REDEMPTION_SUSPENSION
status: SOURCE_CONFIRMED
fields:
  - redemption.rules
  - redemption.suspension
controls:
  - RULE_REDEMPTION_PROCESS_COMPLETE
  - RULE_SUSPENSION_CIRCUMSTANCES_REQUIRED
output_section: SEC_1_13_REDEMPTION_SUSPENSION
```

### 1.14 Détermination et affectation des revenus

```yaml
requirement_id: CIRC005_1_14_FCP_INCOME
status: SOURCE_CONFIRMED
fields:
  - income.determination_method
  - income.allocation_policy
  - income.distribution_policy
  - income.capitalization_policy
output_section: SEC_1_14_INCOME
```

### 1.15 Objectifs, politique, techniques, instruments et capacités d’emprunt

Sous-exigences initiales :

| ID | Contenu |
|---|---|
| `CIRC005_1_15_A_FCP_FINANCIAL_OBJECTIVES` | Objectifs financiers, notamment plus-values ou revenus. |
| `CIRC005_1_15_B_FCP_PLACEMENT_POLICY` | Politique de placement. |
| `CIRC005_1_15_C_FCP_GEOGRAPHIC_SECTOR_SPECIALIZATION` | Spécialisation géographique ou industrielle. |
| `CIRC005_1_15_D_FCP_POLICY_LIMITS` | Limites de la politique de placement. |
| `CIRC005_1_15_E_FCP_TECHNIQUES_INSTRUMENTS` | Techniques et instruments utilisés. |
| `CIRC005_1_15_F_FCP_BORROWING` | Capacités d’emprunt. |

Statut : `SOURCE_CONFIRMED`.

### 1.16 Règles d’évaluation des actifs

```yaml
requirement_id: CIRC005_1_16_FCP_VALUATION
status: SOURCE_CONFIRMED
fields:
  - valuation.methods
  - valuation.price_hierarchy
  - valuation.exception_process
controls:
  - RULE_VALUATION_METHOD_PER_USED_ASSET
output_section: SEC_1_16_VALUATION
```

### 1.17 Détermination des prix d’émission, vente, remboursement ou rachat

Sous-exigences :

| ID | Contenu |
|---|---|
| `CIRC005_1_17_A_FCP_PRICE_METHOD_FREQUENCY` | Méthode et fréquence de calcul des prix. |
| `CIRC005_1_17_B_FCP_TRANSACTION_FEES` | Frais relatifs aux opérations. |
| `CIRC005_1_17_C_FCP_PRICE_PUBLICATION` | Mode, lieux et fréquence de publication. |

Champs principaux : `pricing.*`, `fees.transaction.*`, `pricing.publication.*`.

### 1.18 Rémunérations et remboursements de frais

```yaml
requirement_id: CIRC005_1_18_FCP_REMUNERATION_REIMBURSEMENT
status: SOURCE_CONFIRMED
fields:
  - remunerations
  - expense_reimbursements
beneficiaries:
  - management_company
  - depositary
  - third_parties
controls:
  - RULE_REMUNERATION_CALCULATION_COMPLETE
  - RULE_REIMBURSEMENT_BASIS_COMPLETE
output_section: SEC_1_18_REMUNERATION_REIMBURSEMENT
```

## 5. Partie 1 — Société de gestion d’OPC

### 1.1 Identité, forme, RCCM et sièges

```yaml
requirement_id: CIRC005_1_1_SGO_IDENTITY
status: SOURCE_CONFIRMED
fields:
  - manager.legal_name
  - manager.legal_form
  - manager.rccm_number
  - manager.registered_office
  - manager.central_administration
controls:
  - RULE_CENTRAL_ADMINISTRATION_IF_DIFFERENT
```

### 1.2 Date de constitution

```yaml
requirement_id: CIRC005_1_2_SGO_CONSTITUTION_DATE
status: SOURCE_CONFIRMED
fields:
  - manager.constitution_date
```

### 1.3 Autres OPC gérés

```yaml
requirement_id: CIRC005_1_3_SGO_OTHER_FUNDS
status: SOURCE_CONFIRMED
fields:
  - manager.managed_funds
controls:
  - RULE_OTHER_FUNDS_IF_MANAGER_HAS_OTHER_FUNDS
```

### 1.8 Organes et activités externes significatives

Sous-exigences :

| ID | Contenu |
|---|---|
| `CIRC005_1_8_A_SGO_GOVERNANCE_MEMBERS` | Identité et fonctions des membres des organes d’administration, direction et surveillance. |
| `CIRC005_1_8_B_SGO_EXTERNAL_ACTIVITIES` | Principales activités externes significatives. |

### 1.9 Capital souscrit et libéré

```yaml
requirement_id: CIRC005_1_9_SGO_CAPITAL
status: SOURCE_CONFIRMED
fields:
  - manager.capital.subscribed_amount
  - manager.capital.paid_up_amount
  - manager.capital.currency
  - manager.capital.reference_date
controls:
  - RULE_PAID_UP_NOT_GREATER_THAN_SUBSCRIBED
```

## 6. Partie 2 — Dépositaire

### 2.1 Identité et sièges

```yaml
requirement_id: CIRC005_2_1_DEPOSITARY_IDENTITY
status: SOURCE_CONFIRMED
fields:
  - depositary.legal_name
  - depositary.legal_form
  - depositary.registered_office
  - depositary.central_administration
```

### 2.2 Activité principale

```yaml
requirement_id: CIRC005_2_2_DEPOSITARY_MAIN_ACTIVITY
status: SOURCE_CONFIRMED
fields:
  - depositary.main_activity
```

## 7. Partie 3 — Firmes de conseil et conseillers externes

Condition générale initiale : recours prévu par contrat et rémunération prélevée sur les actifs de l’OPC.

### 3.1 Identité

```yaml
requirement_id: CIRC005_3_1_EXTERNAL_ADVISER_IDENTITY
status: SOURCE_CONFIRMED
fields:
  - external_adviser.legal_name
  - external_adviser.person_name
```

### 3.2 Clauses importantes du contrat

```yaml
requirement_id: CIRC005_3_2_EXTERNAL_ADVISER_CONTRACT
status: SOURCE_CONFIRMED
fields:
  - external_adviser.contract.important_clauses
exclusion:
  - remuneration_clauses
review_roles:
  - LEGAL
```

### 3.3 Autres activités significatives

```yaml
requirement_id: CIRC005_3_3_EXTERNAL_ADVISER_OTHER_ACTIVITIES
status: SOURCE_CONFIRMED
fields:
  - external_adviser.significant_other_activities
  - external_adviser.conflicts
```

## 8. Partie 4 — Paiements, rachats et diffusion des informations

```yaml
requirement_id: CIRC005_4_COUNTRY_ARRANGEMENTS
status: SOURCE_CONFIRMED
fields:
  - distribution_countries
  - distribution_country.paying_agents
  - distribution_country.redemption_locations
  - distribution_country.information_locations
applicability:
  - home_member_state
  - each_other_marketing_member_state
controls:
  - RULE_COUNTRY_ARRANGEMENTS_COMPLETE
output_section: SEC_4_COUNTRY_ARRANGEMENTS
```

## 9. Partie 5 — Autres informations concernant les placements

### 5.1 Performances historiques

```yaml
requirement_id: CIRC005_5_1_HISTORICAL_PERFORMANCE
status: SOURCE_CONFIRMED
fields:
  - performance.history_available
  - performance.series
  - performance.method
coverage_options:
  - IN_PROSPECTUS
  - IN_ATTACHED_CONSTITUTIVE_DOCUMENT
```

Le texte indique que l’information peut être reprise dans le prospectus ou jointe à celui-ci.

### 5.2 Profil de l’investisseur-type

```yaml
requirement_id: CIRC005_5_2_TARGET_INVESTOR
status: SOURCE_CONFIRMED
fields:
  - target_investor
```

### 5.3 Informations d’ordre économique

```yaml
requirement_id: CIRC005_5_3_ECONOMIC_INFORMATION
status: LEGAL_REVIEW_REQUIRED
fields:
  - economic_information
notes:
  - Le contenu exact doit être précisé après étude des textes complémentaires et de la pratique réglementaire.
```

### 5.4 Autres dépenses et commissions

```yaml
requirement_id: CIRC005_5_4_OTHER_EXPENSES
status: SOURCE_CONFIRMED
fields:
  - other_expenses
required_split:
  - paid_directly_by_holder
  - charged_to_fund_assets
controls:
  - RULE_EXPENSE_PAYER_CLASSIFICATION
```

## 10. Prochaines actions du mapping CIRC005

- confirmer la date exacte de publication et l’état actuel de la circulaire ;
- identifier les références complémentaires ;
- relier chaque exigence aux champs canoniques définitifs ;
- créer les questions et options ;
- créer les clauses ;
- créer les contrôles ;
- définir les preuves ;
- faire valider le mapping par la conformité et le juridique ;
- passer les exigences validées de `SOURCE_CONFIRMED` à `VALIDATED` uniquement après revue formelle.

## 11. Instruction n°66/CREPMF/2021 — Source enregistrée et atomisation préparée

### 11.1 État de la source au 2026-08-05

```yaml
source_id: INSTRUCTION_66_CREPMF_2021
official_registry: https://www.amf-umoa.org/reglementation/instruction
registry_status: NON_ABROGE
registry_checked_on: '2026-08-05'
brvm_publication_date: '2022-01-12'
pdf_page_count: 65
atomization_status: PENDING
legal_review_status: PENDING
compliance_review_status: PENDING
```

Le registre officiel AMF-UMOA identifie l’Instruction n°66/2021 comme non abrogée au jour du contrôle. Une publication BRVM permet d’identifier une copie PDF et indique que le texte annule et remplace le précédent. L’identité du texte remplacé, la date exacte de signature, la date d’effet, la taille et le SHA-256 du PDF ainsi que les éventuels modificatifs restent à confirmer.

### 11.2 Artefacts créés

- `regulatory/sources/INSTRUCTION_66_CREPMF_2021.yaml` ;
- `regulatory/plans/INSTRUCTION_66_ATOMIZATION_PLAN_V0_1.yaml`.

### 11.3 Politique d’identifiants

Les futures exigences issues de l’Instruction utilisent le préfixe `INST066`. Les identifiants `CIRC005_*` existants ne sont ni renommés ni réutilisés avec un autre sens.

Exemple prévu :

```text
INST066_ART28_PROSPECTUS_MINIMUM_INFORMATION
```

### 11.4 Domaines d’atomisation préparés

- champ d’application et définitions ;
- agrément et gouvernance des OPC et sociétés de gestion ;
- prospectus, règlement, DICI, information des investisseurs et publicité ;
- actifs éligibles, ratios, diversification, concentration, emprunts et dérivés ;
- valorisation, valeur liquidative, souscription, rachat, suspension et liquidité ;
- dépositaire, conservation, commissaires aux comptes, conseillers et distributeurs ;
- reporting, modifications, restructurations, dissolution et liquidation ;
- crosswalk avec la Circulaire n°05/CREPMF/2022 et le modèle canonique.

### 11.5 Contrôle de non-régression

À ce stade :

- aucune exigence INST066 détaillée n’est créée ;
- aucune matrice CIRC005 n’est modifiée ;
- aucune clause n’est activée ;
- aucune validation juridique ou conformité n’est déclarée ;
- l’étape suivante consiste à produire l’index structurel du texte après contrôle d’intégrité de la copie PDF.
