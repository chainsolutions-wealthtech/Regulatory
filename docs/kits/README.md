# Kit Loop Engineering — Archive source

> **Statut :** `APPLICABLE`  
> **Propriétaire :** propriétaire du dépôt.  
> **Lecteurs :** agents, mainteneurs, audit et gouvernance.

## Archive reçue

- Nom reçu : `loop-engineering-starter-kit(1).zip`
- Version du manifeste : `1.0.0`
- Taille : `112477` octets
- SHA-256 : `8054b1ea4799364b5d709166536c927b2e28ddd47aba84553469a5469ffecc95`
- Contenu : `176` fichiers Markdown et un manifeste JSON.

## Conservation dans le dépôt

Le connecteur GitHub utilisé ne permettait pas d’envoyer directement un fichier binaire local. L’archive exacte est donc conservée sous forme Base64 découpée dans `docs/kits/parts/`. Cette représentation est réversible octet pour octet et son empreinte doit correspondre à celle ci-dessus.

## Reconstruction

```bash
cat docs/kits/parts/loop-engineering-starter-kit-1.0.0.zip.b64.part* \
  | base64 --decode \
  > loop-engineering-starter-kit-1.0.0.zip
sha256sum loop-engineering-starter-kit-1.0.0.zip
```

Sous PowerShell, concaténer les parties par ordre lexical, convertir depuis Base64 puis vérifier SHA-256.

## Règles

- ne jamais modifier une partie isolément ;
- toute nouvelle version utilise un nouveau nom et une nouvelle empreinte ;
- ne pas traiter le kit comme source métier ou réglementaire ;
- les fichiers intégrés dans le dépôt peuvent être adaptés, mais l’archive source reste immuable ;
- toute divergence est enregistrée dans `DRIFT_DETECTION.md` et `SUIVI.md`.

## Checklist

- [ ] treize parties présentes ;
- [ ] ordre lexical correct ;
- [ ] décodage réussi ;
- [ ] taille `112477` octets ;
- [ ] SHA-256 conforme ;
- [ ] manifeste et 176 chemins vérifiés.
