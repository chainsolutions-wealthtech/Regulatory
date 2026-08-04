# FILES_CATALOG — Catalogue documentaire

> **Statut :** `APPLICABLE`

Ce catalogue décrit les familles de fichiers du dépôt. La hiérarchie d’autorité demeure définie dans `SOURCE_OF_TRUTH.md`.

| Famille | Emplacement | Rôle |
|---|---|---|
| Gouvernance | racine et `docs/01-governance/` | contexte, décisions, responsabilités, changements, audit |
| Produit | `docs/02-product/` | vision, usages, priorisation, validation |
| Architecture | `docs/03-architecture/` | vues détaillées; `docs/ARCHITECTURE.md` reste canonique |
| Développement | `docs/04-development/` | conventions et workflow |
| Qualité | `docs/05-quality/` | tests, validations, non-régression |
| Delivery | `docs/06-delivery/` | build, versionnement et procédures conditionnelles |
| Opérations | `docs/07-operations/` | exploitation future et modèles d’incident |
| Sécurité | `docs/08-security/` | accès, secrets, vulnérabilités, vie privée |
| Boucle | `docs/09-loop/` | itérations, apprentissages et santé de boucle |
| IA | `docs/10-ai/` | contexte, autonomie, outils et revues |
| Modèles | `docs/11-templates/` | modèles sans données réelles |
| Optionnel | `docs/12-optional/` | modules créés avec statut explicite |
| ADR | `docs/adr/` | décisions structurantes détaillées |

Documents historiques maintenus comme canoniques : `README.md`, `AGENTS.md`, `SUIVI.md`, `TODO.md`, `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/PROSPECTUS_ENGINE_SPEC.md` et `docs/REGULATORY_MAPPING.md`.

`MANIFEST.md` et `DOCUMENT_INTEGRATION_MATRIX.md` doivent être vérifiés contre l’arborescence réelle après chaque évolution documentaire importante.
