# Intégration API Dolibarr - NewDoli

## 🔧 **Correction de l'URL de l'API**

### ❌ **Problème Identifié**
L'application utilisait incorrectement l'URL de base du frontend (localhost:4200) au lieu de l'URL Dolibarr configurée, causant des erreurs 404 lors des appels API.

### ✅ **Solution Implémentée**

#### **1. URL de l'API Dolibarr**
- **Format** : `{URL_DOLIBARR}/api/index.php/{endpoint}`
- **Exemple** : `https://mon-dolibarr.com/api/index.php/login`

#### **2. Modifications du Service `DolibarrApiService`**

##### **Avant** :
```typescript
// Utilisait ConfigService.getApiUrl() (inexistant)
private getApiUrl(endpoint: string): string {
  const baseUrl = this.configService.getApiUrl();
  return `${baseUrl}${endpoint}`;
}
```

##### **Après** :
```typescript
// Récupère l'URL Dolibarr depuis la base de données Dexie
private async getApiUrl(endpoint: string): Promise<string> {
  const dolibarrUrl = await this.databaseService.getConfigurationValue('dolibarr_url');
  if (!dolibarrUrl) {
    throw new Error('Dolibarr URL not configured');
  }
  
  // Assure que l'URL se termine par un slash
  const baseUrl = dolibarrUrl.endsWith('/') ? dolibarrUrl : `${dolibarrUrl}/`;
  return `${baseUrl}api/index.php/${endpoint}`;
}
```

#### **3. Méthodes Mises à Jour**

Toutes les méthodes du service utilisent maintenant `getApiUrl$()` qui retourne un Observable :

- ✅ `login(login, password)` - Authentification
- ✅ `getUserInfo(token)` - Informations utilisateur
- ✅ `validateToken(token)` - Validation du token
- ✅ `getUsers(token)` - Liste des utilisateurs
- ✅ `getThirdParties(token)` - Liste des tiers
- ✅ `getGroups(token)` - Liste des groupes
- ✅ `logout(token)` - Déconnexion
- ✅ `testConnection()` - Test de connexion

### 🔄 **Flux de Construction de l'URL**

1. **Récupération** : L'URL Dolibarr est récupérée depuis la table `configurations` en base Dexie
2. **Validation** : Vérification que l'URL est configurée
3. **Normalisation** : Ajout d'un slash final si nécessaire
4. **Construction** : Concaténation avec `/api/index.php/{endpoint}`

### 📝 **Exemples d'URLs Générées**

| Configuration | Endpoint | URL Finale |
|---------------|----------|------------|
| `https://demo.dolibarr.org` | `login` | `https://demo.dolibarr.org/api/index.php/login` |
| `http://localhost/dolibarr/` | `users` | `http://localhost/dolibarr/api/index.php/users` |
| `https://mon-entreprise.com/dolibarr` | `thirdparties` | `https://mon-entreprise.com/dolibarr/api/index.php/thirdparties` |

### 🛡️ **Gestion d'Erreurs**

- **URL non configurée** : Erreur explicite avec message informatif
- **URL invalide** : Validation de format d'URL
- **Erreurs réseau** : Gestion des erreurs HTTP avec messages contextuels

### 🚀 **Avantages**

1. **Flexibilité** : L'URL Dolibarr peut être modifiée sans redéploiement
2. **Sécurité** : L'URL est stockée localement et peut être chiffrée
3. **Maintenance** : Configuration centralisée dans la base de données
4. **Debugging** : Messages d'erreur clairs pour le diagnostic

### 🔧 **Configuration Requise**

Pour que l'API fonctionne, l'utilisateur doit :

1. **Configurer l'URL Dolibarr** via la page `/config`
2. **S'assurer que l'API Dolibarr est activée** sur le serveur
3. **Vérifier les permissions** de l'utilisateur dans Dolibarr

---

**Note** : Cette correction garantit que tous les appels API utilisent la bonne URL Dolibarr configurée par l'utilisateur, éliminant les erreurs 404 et permettant une intégration correcte avec l'API Dolibarr.
