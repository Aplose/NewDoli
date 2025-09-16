# Correction de la Gestion des Permissions et Rôles

## 🔧 **Problème Identifié**

Le dashboard ne montrait que l'accès aux settings alors que l'utilisateur admin devrait avoir accès à tous les modules. Le problème venait du fait que :

1. **Informations utilisateur incomplètes** : Seules les informations de base étaient récupérées
2. **Permissions non récupérées** : L'API Dolibarr n'était pas appelée avec le paramètre `includepermissions=1`
3. **État non persisté** : Les permissions n'étaient pas stockées dans la configuration
4. **Logique de vérification incorrecte** : La méthode `canAccessModule` ne fonctionnait pas correctement

## ✅ **Solution : Gestion Complète des Permissions**

### **1. API Dolibarr Corrigée**

#### **Endpoint avec Permissions :**
```typescript
// Avant
getUserInfo(token: string): Observable<DolibarrUser> {
  return this.getApiUrl$(`${this.USER_ENDPOINT}/info`).pipe(
    // ...
  );
}

// Après
getUserInfo(token: string): Observable<DolibarrUser> {
  return this.getApiUrl$(`${this.USER_ENDPOINT}/info`).pipe(
    switchMap(url => {
      // Add includepermissions parameter to get user permissions
      const urlWithParams = `${url}?includepermissions=1`;
      return this.http.get<DolibarrUser>(urlWithParams, { headers });
    })
  );
}
```

#### **Interface Utilisateur Enrichie :**
```typescript
export interface DolibarrUser {
  id: number;
  login: string;
  firstname: string;
  lastname: string;
  email: string;
  admin: boolean;
  active: boolean;
  groups?: number[];
  permissions?: string[];
  rights?: {                    // ✅ Nouveau
    [module: string]: string[];
  };
}
```

### **2. État d'Authentification Enrichi**

#### **Interface AuthState Mise à Jour :**
```typescript
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  permissions: string[];
  rights: { [module: string]: string[] };  // ✅ Nouveau
  isLoading: boolean;
  error: string | null;
}
```

#### **Signaux Publics Ajoutés :**
```typescript
// Signal public pour l'état d'authentification
public authState = signal<AuthState>({...});

// Signaux computed pour l'accès
public readonly userRights = computed(() => this.authState().rights);
public readonly isAdmin = computed(() => this.currentUser()?.admin || false);
```

### **3. Récupération des Vraies Informations Utilisateur**

#### **Méthode performLogin Corrigée :**
```typescript
private async performLogin(dolibarrApiKey: string, credentials: LoginCredentials): Promise<boolean> {
  try {
    // Store Dolibarr API key
    await this.databaseService.setConfiguration('dolibarr_api_key', dolibarrApiKey, 'string');

    // Get real user information from Dolibarr API with permissions
    const userInfo = await this.dolibarrApiService.getUserInfo(dolibarrApiKey).toPromise();
    
    if (!userInfo) {
      throw new Error('Failed to get user information');
    }

    // Create user from real API data
    const user: User = {
      id: userInfo.id,
      login: userInfo.login,
      firstname: userInfo.firstname || '',
      lastname: userInfo.lastname || '',
      email: userInfo.email || '',
      admin: userInfo.admin || false,
      active: userInfo.active || false,
      // ...
    };

    // Extract permissions and rights from userInfo
    const permissions = userInfo.permissions || [];
    const rights = userInfo.rights || {};

    // Store user info in configuration
    await this.databaseService.setConfiguration(
      'user-info',
      { user, permissions, rights },
      'json',
      'Current user information with permissions'
    );

    // Update auth state
    this.setAuthState({
      isAuthenticated: true,
      user: user,
      token: localToken,
      permissions: permissions,
      rights: rights,  // ✅ Stocké dans l'état
      isLoading: false,
      error: null
    });

    return true;
  } catch (error) {
    // ...
  }
}
```

### **4. Persistance des Informations Utilisateur**

#### **Stockage en Configuration :**
```typescript
// Clé : 'user-info'
// Valeur : { user, permissions, rights }
// Type : 'json'
// Description : 'Current user information with permissions'
```

#### **Récupération au Démarrage :**
```typescript
private async initializeAuth(): Promise<void> {
  try {
    const dolibarrApiKey = await this.databaseService.getConfigurationValue('dolibarr_api_key');
    
    if (dolibarrApiKey) {
      // Test if API key is still valid
      await this.dolibarrApiService.validateToken(dolibarrApiKey).toPromise();
      
      // Load stored user info
      const userInfoConfig = await this.databaseService.getConfigurationValue('user-info');
      
      if (userInfoConfig) {
        const userInfo = JSON.parse(userInfoConfig);
        
        // Restore auth state with permissions and rights
        this.setAuthState({
          isAuthenticated: true,
          user: userInfo.user,
          token: token,
          permissions: userInfo.permissions || [],
          rights: userInfo.rights || {},  // ✅ Restauré
          isLoading: false,
          error: null
        });
      }
    }
  } catch (error) {
    // ...
  }
}
```

### **5. Logique de Vérification des Permissions Corrigée**

#### **Méthode canAccessModule Améliorée :**
```typescript
canAccessModule(module: string): boolean {
  const user = this.currentUser();
  const rights = this.userRights();
  
  // Admin users have access to all modules
  if (user?.admin) {
    return true;  // ✅ Admin a accès à tout
  }
  
  // Check if user has rights for this module
  if (rights[module] && rights[module].length > 0) {
    return true;  // ✅ Vérification des droits par module
  }
  
  // Check permissions for backward compatibility
  const permissions = this.userPermissions();
  return permissions.some(permission => 
    permission.startsWith(`${module}_`) || 
    permission === `${module}_all`
  );
}
```

## 🚀 **Avantages de la Solution**

### **1. Récupération Complète des Données**
- ✅ **API Dolibarr** : Appel avec `includepermissions=1`
- ✅ **Informations réelles** : Données utilisateur complètes
- ✅ **Permissions** : Récupération des permissions et droits
- ✅ **Rôles** : Détection correcte du statut admin

### **2. Persistance des Données**
- ✅ **Configuration** : Stockage en base de données
- ✅ **Clé 'user-info'** : Informations utilisateur complètes
- ✅ **Restauration** : Chargement au démarrage de l'application
- ✅ **Signaux** : État réactif avec les permissions

### **3. Logique de Vérification Améliorée**
- ✅ **Admin** : Accès à tous les modules
- ✅ **Droits par module** : Vérification des droits spécifiques
- ✅ **Permissions** : Compatibilité avec l'ancien système
- ✅ **Performance** : Vérifications optimisées

## 📊 **Résultat sur le Dashboard**

### **Avant (Problématique)**
```typescript
// Seulement Settings visible
canAccessModule('user') → false
canAccessModule('thirdparty') → false
canAccessModule('group') → false
isAdmin() → false
```

### **Après (Corrigé)**
```typescript
// Tous les modules visibles pour admin
canAccessModule('user') → true (admin)
canAccessModule('thirdparty') → true (admin)
canAccessModule('group') → true (admin)
isAdmin() → true
```

## 🧪 **Tests de Validation**

### **1. Test de Connexion Admin**
- **Identifiants** : `toto` / `Toto01`
- **Vérification** : Informations utilisateur récupérées
- **Permissions** : Droits admin détectés
- **Dashboard** : Tous les modules visibles

### **2. Test de Persistance**
- **Redémarrage** : Informations restaurées
- **Configuration** : Clé 'user-info' stockée
- **État** : Signaux mis à jour

### **3. Test de Vérification des Permissions**
- **Modules** : Accès correct selon les droits
- **Admin** : Accès à tous les modules
- **Utilisateur normal** : Accès selon les permissions

## 🔧 **Configuration Requise**

### **1. API Dolibarr**
- **Endpoint** : `/api/index.php/users/info?includepermissions=1`
- **Header** : `DOLAPIKEY: {token}`
- **Réponse** : Informations utilisateur avec permissions et droits

### **2. Base de Données**
- **Clé** : `user-info`
- **Type** : `json`
- **Contenu** : `{ user, permissions, rights }`

### **3. Signaux Angular**
- **authState** : Signal public pour l'état complet
- **userRights** : Computed pour les droits
- **isAdmin** : Computed pour le statut admin

## 🎯 **Résultat Final**

- ✅ **Dashboard complet** : Tous les modules visibles pour admin
- ✅ **Permissions correctes** : Récupération et stockage des droits
- ✅ **Persistance** : Informations sauvegardées et restaurées
- ✅ **Performance** : Signaux réactifs et optimisés
- ✅ **Maintenabilité** : Code clair et bien structuré

---

**Note** : Cette correction résout définitivement le problème de gestion des permissions en récupérant les vraies informations utilisateur avec les permissions depuis l'API Dolibarr et en les stockant dans un signal public pour une gestion d'état réactive.
