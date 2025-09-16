# Barre de Navigation Supérieure - Guide d'utilisation

## Fonctionnalités

La nouvelle barre de navigation supérieure inclut :

1. **Informations de l'utilisateur connecté** :
   - Avatar avec initiales
   - Nom complet (prénom + nom)
   - Rôle (Admin/User)

2. **Titre de la page courante** :
   - Mise à jour automatique lors des changements de route
   - Centré dans la barre

3. **Statut de connectivité** :
   - Indicateur visuel Online/Offline
   - Dernière synchronisation

## Comportement

### Masquage automatique
- La barre se masque automatiquement lors des changements de route
- Elle reste masquée par défaut pour maximiser l'espace d'affichage

### Affichage par geste
- **Swipe vers le haut** : Affiche la barre
- **Swipe vers le bas** : Masque la barre
- Seuil de détection : 50px de mouvement

## Test de la fonctionnalité

1. **Démarrez l'application** :
   ```bash
   ng serve
   ```

2. **Testez le masquage automatique** :
   - Naviguez entre les pages (Dashboard, Users, Third Parties, etc.)
   - La barre doit se masquer à chaque changement de route

3. **Testez l'affichage par geste** :
   - Sur mobile/tablette : Faites un swipe vers le haut depuis le haut de l'écran
   - Sur desktop : Utilisez le trackpad ou la souris pour simuler un swipe vers le haut

4. **Vérifiez les informations affichées** :
   - Avatar avec initiales de l'utilisateur connecté
   - Nom complet et rôle
   - Titre de la page courante
   - Statut de connectivité

## Fichiers créés/modifiés

### Nouveaux fichiers :
- `src/app/services/page-title.service.ts` - Service de gestion des titres de page
- `src/app/components/top-bar/top-bar.component.ts` - Composant de la barre
- `src/app/components/top-bar/top-bar.component.scss` - Styles de la barre

### Fichiers modifiés :
- `src/app/app.ts` - Import du composant TopBar
- `src/app/app.html` - Ajout de la balise `<app-top-bar />`
- `src/app/app.scss` - Styles globaux pour la barre fixe

## Personnalisation

### Modifier les titres de page
Éditez le fichier `page-title.service.ts` et modifiez l'objet `pageTitles` :

```typescript
private readonly pageTitles: { [key: string]: string } = {
  'dashboard': 'Tableau de Bord',
  'users': 'Utilisateurs',
  // ... autres titres
};
```

### Modifier l'apparence
Éditez le fichier `top-bar.component.scss` pour personnaliser :
- Couleurs de la barre
- Taille des éléments
- Animations
- Responsive design

### Désactiver le masquage automatique
Dans `page-title.service.ts`, commentez la ligne :
```typescript
// this.isVisible.set(false);
```

## Dépannage

### La barre ne s'affiche pas
- Vérifiez que le composant est bien importé dans `app.ts`
- Vérifiez que la balise `<app-top-bar />` est présente dans `app.html`

### Le geste de swipe ne fonctionne pas
- Vérifiez que les événements touch sont bien attachés
- Testez sur un appareil tactile réel

### Les informations utilisateur ne s'affichent pas
- Vérifiez que l'utilisateur est bien connecté
- Vérifiez que le service AuthService fonctionne correctement
