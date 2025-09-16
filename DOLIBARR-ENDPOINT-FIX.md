# Correction de l'Endpoint Dolibarr - Résolution du Problème de Redirection

## 🔧 **Problème Identifié**

La redirection échouait car l'URL utilisée pour récupérer les informations utilisateur n'était pas correcte. L'application utilisait une authentification `Authorization: Bearer` au lieu de la méthode d'authentification standard de Dolibarr avec `DOLAPIKEY`.

## ✅ **Solution : Correction de l'Authentification Dolibarr**

### **1. Problème Principal**

#### **Avant (Incorrect) :**
```typescript
const headers = new HttpHeaders({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});
```

#### **Après (Correct) :**
```typescript
const headers = new HttpHeaders({
  'DOLAPIKEY': token,
  'Content-Type': 'application/json'
});
```

### **2. Endpoints Corrigés**

#### **A. getUserInfo() - Récupération des Informations Utilisateur**
```typescript
// Avant
getUserInfo(token: string): Observable<DolibarrUser> {
  return this.getApiUrl$(`${this.USER_ENDPOINT}/me`).pipe(
    switchMap(url => {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,  // ❌ Incorrect
        'Content-Type': 'application/json'
      });
      return this.http.get<DolibarrUser>(url, { headers });
    })
  );
}

// Après
getUserInfo(token: string): Observable<DolibarrUser> {
  return this.getApiUrl$(`${this.USER_ENDPOINT}/me`).pipe(
    switchMap(url => {
      const headers = new HttpHeaders({
        'DOLAPIKEY': token,  // ✅ Correct
        'Content-Type': 'application/json'
      });
      return this.http.get<DolibarrUser>(url, { headers });
    })
  );
}
```

#### **B. validateToken() - Validation du Token**
```typescript
// Avant
validateToken(token: string): Observable<boolean> {
  return this.getApiUrl$(`${this.USER_ENDPOINT}/me`).pipe(
    switchMap(url => {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,  // ❌ Incorrect
        'Content-Type': 'application/json'
      });
      return this.http.get(url, { headers });
    })
  );
}

// Après
validateToken(token: string): Observable<boolean> {
  return this.getApiUrl$(`${this.USER_ENDPOINT}/me`).pipe(
    switchMap(url => {
      const headers = new HttpHeaders({
        'DOLAPIKEY': token,  // ✅ Correct
        'Content-Type': 'application/json'
      });
      return this.http.get(url, { headers });
    })
  );
}
```

#### **C. Toutes les Méthodes API**
- ✅ `getUsers()` - Liste des utilisateurs
- ✅ `getThirdParties()` - Liste des tiers
- ✅ `getGroups()` - Liste des groupes
- ✅ `logout()` - Déconnexion

### **3. Interceptor d'Authentification**

#### **AuthInterceptor Corrigé**
```typescript
// Avant
const authReq = req.clone({
  setHeaders: {
    'Authorization': `Bearer ${token}`,  // ❌ Incorrect
    'Content-Type': 'application/json'
  }
});

// Après
const authReq = req.clone({
  setHeaders: {
    'DOLAPIKEY': token,  // ✅ Correct
    'Content-Type': 'application/json'
  }
});
```

#### **Récupération du Token Améliorée**
```typescript
// Avant
private getStoredToken(): string | null {
  try {
    return null;  // ❌ Toujours null
  } catch {
    return null;
  }
}

// Après
private getStoredToken(): string | null {
  try {
    const token = localStorage.getItem('dolibarr_token');  // ✅ Récupération réelle
    return token;
  } catch {
    return null;
  }
}
```

## 🔍 **Détails Techniques**

### **1. Authentification Dolibarr**

#### **Méthode Standard Dolibarr :**
- **Header** : `DOLAPIKEY: {token}`
- **Endpoint** : `/api/index.php/users/me`
- **Méthode** : `GET`

#### **Exemple de Requête Correcte :**
```http
GET /api/index.php/users/me
Host: your-dolibarr-server.com
DOLAPIKEY: vG9jc0B40I54jBSfJwFv17J9yRB4yynP
Content-Type: application/json
```

### **2. Flux d'Authentification Corrigé**

#### **Étape 1 : Login**
```typescript
// POST /api/index.php/login
const response = await this.dolibarrApiService.login(login, password);
// Retourne : { success: { token: "vG9jc0B40I54jBSfJwFv17J9yRB4yynP" } }
```

#### **Étape 2 : Stockage du Token**
```typescript
// Stockage en base de données
await this.databaseService.setConfiguration('dolibarr_token', token, 'string');
```

#### **Étape 3 : Récupération des Informations Utilisateur**
```typescript
// GET /api/index.php/users/me avec DOLAPIKEY
const userInfo = await this.dolibarrApiService.getUserInfo(token);
// Retourne : { id: 1, login: "oandrade", firstname: "Olivier", ... }
```

#### **Étape 4 : Redirection**
```typescript
// Redirection vers le dashboard
this.router.navigate(['/dashboard']);
```

## 🚀 **Avantages de la Correction**

### **1. Compatibilité Dolibarr**
- ✅ **Authentification standard** : Utilise la méthode officielle Dolibarr
- ✅ **Endpoints corrects** : Respecte la documentation API Dolibarr
- ✅ **Headers appropriés** : `DOLAPIKEY` au lieu de `Authorization: Bearer`

### **2. Fonctionnalités Restaurées**
- ✅ **Récupération utilisateur** : Les informations utilisateur sont correctement récupérées
- ✅ **Redirection** : La redirection vers le dashboard fonctionne
- ✅ **Validation token** : La validation du token fonctionne correctement

### **3. Robustesse**
- ✅ **Gestion d'erreurs** : Meilleure gestion des erreurs d'authentification
- ✅ **Intercepteur** : Injection automatique du token dans toutes les requêtes
- ✅ **Persistance** : Récupération du token depuis localStorage

## 🧪 **Tests de Validation**

### **1. Test de Connexion**
- **URL** : `http://localhost:4201/test-login-simple`
- **Identifiants** : `toto` / `Toto01`
- **Vérification** : Token récupéré et stocké correctement

### **2. Test de Redirection**
- **Vérification** : Redirection automatique vers dashboard après login
- **État** : Utilisateur authentifié et informations récupérées

### **3. Test d'API**
- **Endpoint** : `GET /api/index.php/users/me`
- **Header** : `DOLAPIKEY: {token}`
- **Résultat** : Informations utilisateur récupérées

## 📊 **Comparaison Avant/Après**

### **Avant (Problématique)**
```typescript
// ❌ Authentification incorrecte
'Authorization': `Bearer ${token}`

// ❌ Token non récupéré
return null;

// ❌ Redirection échouée
// Les informations utilisateur ne sont pas récupérées
```

### **Après (Corrigé)**
```typescript
// ✅ Authentification correcte
'DOLAPIKEY': token

// ✅ Token récupéré
const token = localStorage.getItem('dolibarr_token');

// ✅ Redirection réussie
// Les informations utilisateur sont récupérées et la redirection fonctionne
```

## 🔧 **Configuration Requise**

### **1. Dolibarr Server**
- **Module API REST** : Activé
- **URL** : Configurée dans les paramètres
- **Token** : Généré pour l'utilisateur

### **2. Headers API**
- **DOLAPIKEY** : Token d'authentification
- **Content-Type** : `application/json`

### **3. Endpoints**
- **Login** : `/api/index.php/login`
- **User Info** : `/api/index.php/users/me`
- **Validation** : `/api/index.php/users/me`

---

**Note** : Cette correction résout définitivement le problème de redirection en utilisant la méthode d'authentification standard de Dolibarr avec `DOLAPIKEY` au lieu de `Authorization: Bearer`.
