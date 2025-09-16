# Débogage du Problème d'Authentification

## 🔍 **Problème à Résoudre**

L'utilisateur rapporte que le problème n'est pas corrigé : quand on accède directement à la route par défaut, le dashboard ne montre que le module "Settings" au lieu de tous les modules.

## 🛠️ **Outils de Débogage Ajoutés**

### **1. Logs de Débogage Étendus**

#### **Dans `loadUserInfoFromStorage()` :**
```typescript
console.log('Loading user info from storage...');
console.log('Storage data:', {
  hasToken: !!token,
  hasUserInfo: !!userInfoConfig,
  userInfoLength: userInfoConfig?.length || 0
});
console.log('Parsed user info:', {
  user: userInfo.user,
  permissions: userInfo.permissions,
  rights: userInfo.rights
});
```

#### **Dans `canAccessModule()` :**
```typescript
console.log(`Checking access for module '${module}':`, {
  user: user?.login,
  admin: user?.admin,
  permissions: permissions,
  rights: rights,
  moduleRights: rights[module]
});
```

### **2. Composant de Débogage**

#### **Route de Débogage :**
- **URL** : `/debug-auth`
- **Fonction** : Afficher l'état complet de l'authentification
- **Données** : État d'authentification, informations utilisateur, tests d'accès

#### **Fonctionnalités du Composant :**
- ✅ **État d'authentification** : Affichage complet de `authState`
- ✅ **Informations utilisateur** : User, permissions, rights, admin
- ✅ **Tests d'accès** : Vérification pour chaque module
- ✅ **Actions** : Refresh state, clear storage

## 🔍 **Étapes de Diagnostic**

### **1. Vérifier les Logs de la Console**

#### **Logs Attendus :**
```
Loading user info from storage...
Storage data: { hasToken: true, hasUserInfo: true, userInfoLength: 1234 }
Parsed user info: { user: {...}, permissions: [...], rights: {...} }
User info loaded from storage: { user: "toto", admin: true, permissions: 5, rights: 3 }
```

#### **Logs de Vérification d'Accès :**
```
Checking access for module 'user': { user: "toto", admin: true, permissions: [...], rights: {...} }
Access granted to 'user': User is admin
```

### **2. Utiliser le Composant de Débogage**

#### **Accès au Composant :**
1. Aller sur `/debug-auth`
2. Vérifier l'état d'authentification
3. Tester les accès aux modules
4. Utiliser "Refresh State" si nécessaire

### **3. Vérifier les Données Stockées**

#### **Dans la Console du Navigateur :**
```javascript
// Vérifier localStorage
localStorage.getItem('newdoli_auth_token')

// Vérifier la base de données (via DevTools)
// Aller dans Application > IndexedDB > NewDoli > configurations
// Chercher la clé 'user-info'
```

## 🚨 **Problèmes Possibles**

### **1. Données Non Stockées**
- **Symptôme** : `hasUserInfo: false`
- **Cause** : Les informations utilisateur ne sont pas sauvegardées
- **Solution** : Vérifier la méthode `performLogin()`

### **2. Données Corrompues**
- **Symptôme** : `hasUserInfo: true` mais erreur de parsing
- **Cause** : Format JSON invalide
- **Solution** : Vérifier le format des données stockées

### **3. État Non Mis à Jour**
- **Symptôme** : Données stockées mais `isAuthenticated: false`
- **Cause** : `setAuthState()` ne fonctionne pas
- **Solution** : Vérifier les signaux Angular

### **4. Logique d'Accès Incorrecte**
- **Symptôme** : `admin: true` mais `canAccessModule()` retourne `false`
- **Cause** : Problème dans la logique de vérification
- **Solution** : Vérifier la méthode `canAccessModule()`

## 🔧 **Actions Correctives**

### **1. Si les Données Ne Sont Pas Stockées**
```typescript
// Vérifier dans performLogin()
await this.databaseService.setConfiguration(
  'user-info',
  { user, permissions, rights },
  'json',
  'Current user information with permissions'
);
```

### **2. Si l'État N'est Pas Mis à Jour**
```typescript
// Vérifier setAuthState()
this.setAuthState({
  isAuthenticated: true,
  user: userInfo.user,
  token: token,
  permissions: userInfo.permissions || [],
  rights: userInfo.rights || {},
  isLoading: false,
  error: null
});
```

### **3. Si la Logique d'Accès Est Incorrecte**
```typescript
// Vérifier canAccessModule()
if (user?.admin) {
  return true; // Admin a accès à tout
}
```

## 📊 **Résultats Attendus**

### **1. Logs de Console Corrects**
- ✅ Chargement des informations utilisateur
- ✅ État d'authentification mis à jour
- ✅ Vérifications d'accès réussies

### **2. Composant de Débogage**
- ✅ `isAuthenticated: true`
- ✅ `admin: true`
- ✅ Tous les modules accessibles

### **3. Dashboard Fonctionnel**
- ✅ Tous les modules visibles
- ✅ Navigation correcte
- ✅ Permissions respectées

## 🎯 **Prochaines Étapes**

1. **Tester l'application** avec les logs de débogage
2. **Utiliser `/debug-auth`** pour vérifier l'état
3. **Identifier le problème** spécifique
4. **Appliquer la correction** appropriée
5. **Valider la solution** avec les tests

---

**Note** : Cette approche de débogage systématique permettra d'identifier précisément où se situe le problème dans la chaîne d'authentification et de le corriger efficacement.
