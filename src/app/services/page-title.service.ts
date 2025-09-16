import { Injectable, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PageTitleService {
  private readonly pageTitles: { [key: string]: string } = {
    'dashboard': 'Dashboard',
    'users': 'Users',
    'users/new': 'New User',
    'groups': 'Groups',
    'groups/new': 'New Group',
    'third-parties': 'Third Parties',
    'third-parties/new': 'New Third Party',
    'settings': 'Settings',
    'field-visibility': 'Field Visibility',
    'config': 'Configuration',
    'login': 'Login',
    'unauthorized': 'Unauthorized',
    'not-found': 'Not Found'
  };

  public currentPageTitle = signal<string>('NewDoli');

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updatePageTitle(event.url);
      });
  }

  private updatePageTitle(url: string): void {
    // Nettoyer l'URL pour obtenir le chemin de base
    const cleanUrl = url.split('?')[0].split('#')[0];
    const pathSegments = cleanUrl.split('/').filter(segment => segment);
    
    // Construire le chemin pour la recherche
    let searchPath = pathSegments.join('/');
    
    // Si c'est une route d'édition, utiliser le pattern générique
    if (searchPath.includes('/edit')) {
      const basePath = pathSegments.slice(0, -2).join('/');
      searchPath = basePath + '/:id/edit';
    }
    
    // Chercher le titre correspondant
    const title = this.pageTitles[searchPath] || this.pageTitles[pathSegments[0]] || 'NewDoli';
    this.currentPageTitle.set(title);
  }
}
