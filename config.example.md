# Configuration Example - NewDoli

## 🔧 **Configuration Requise**

### **1. URL Dolibarr**
```
URL: https://your-dolibarr-instance.com
```

### **2. Identifiants de Test**
```
Login: test_user
Password: test_password
```

### **3. Token API (après connexion)**
```
Token: YOUR_DOLIBARR_TOKEN_HERE
```

## 📝 **Instructions de Configuration**

1. **Configurer l'URL Dolibarr** via la page `/config`
2. **Utiliser les identifiants** fournis par votre administrateur Dolibarr
3. **Le token sera automatiquement** généré et stocké après connexion

## ⚠️ **Sécurité**

- Ne jamais commiter de vrais tokens ou mots de passe
- Utiliser des variables d'environnement en production
- Changer les identifiants par défaut

## 🚀 **Démarrage**

1. `npm install`
2. `npm start`
3. Accéder à `http://localhost:4200`
4. Configurer l'URL Dolibarr
5. Se connecter avec vos identifiants
