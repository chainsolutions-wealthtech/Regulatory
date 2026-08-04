# Architecture — Adaptateur documentaire

> **Statut :** `APPLICABLE`  
> **Type :** `CREATE_ADAPTER`  
> **Autorité canonique :** `docs/ARCHITECTURE.md`.

## Finalité

Le kit prévoit ce chemin, mais le dépôt possédait déjà `docs/ARCHITECTURE.md` avant LOOP-GOV-001. Ce fichier sert uniquement d’index vers le document canonique et évite toute duplication divergente.

## Règles

- ne pas recopier l’architecture complète ici ;
- modifier d’abord `docs/ARCHITECTURE.md` lorsqu’une décision d’architecture est validée ;
- utiliser les autres documents de ce dossier pour détailler un aspect sans contredire le document canonique ;
- toute migration future du chemin canonique exige une ADR, une analyse d’impact, la mise à jour de tous les liens et une période de compatibilité.

## Migration et rollback

Une migration peut être décidée si la nouvelle taxonomie devient stable. Le rollback consiste à maintenir `docs/ARCHITECTURE.md` comme canonique et ce fichier comme adaptateur. Aucune suppression ou renommage n’est autorisé dans LOOP-GOV-001.

## Liens

- [Architecture canonique](../ARCHITECTURE.md)
- [Décisions](../DECISIONS.md)
- [Matrice d’intégration](../../DOCUMENT_INTEGRATION_MATRIX.md)

## Checklist

- [ ] Aucun contenu canonique dupliqué.
- [ ] Liens valides.
- [ ] Toute migration couverte par ADR.
