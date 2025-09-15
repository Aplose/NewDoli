# Test de la Configuration NewDoli

## Flux de l'application

1. **Premier accès** : L'utilisateur arrive sur `/` qui redirige vers `/config`
2. **Configuration** : L'utilisateur doit saisir l'URL Dolibarr
3. **Sauvegarde** : La configuration est sauvegardée dans Dexie
4. **Redirection** : L'utilisateur est redirigé vers `/login`
5. **Connexion** : L'utilisateur se connecte avec admin/admin
6. **Dashboard** : Accès au dashboard principal
7. **Paramètres** : L'URL peut être modifiée dans les paramètres

## URLs de test

- **Configuration** : http://localhost:4200/config
- **Login** : http://localhost:4200/login
- **Dashboard** : http://localhost:4200/dashboard
- **Paramètres** : http://localhost:4200/settings

## Base de données

La configuration est stockée dans la table `configurations` avec :
- `key`: "dolibarr_url"
- `value`: URL du serveur Dolibarr
- `type`: "string"
- `description`: "Dolibarr server URL"

## Fonctionnalités implémentées

✅ Page de configuration initiale
✅ Validation de l'URL
✅ Sauvegarde dans Dexie
✅ Guard de configuration
✅ Page de paramètres pour modification
✅ Interface utilisateur moderne
✅ Gestion des erreurs
