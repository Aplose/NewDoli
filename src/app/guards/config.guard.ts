import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DatabaseService } from '../services/database.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigGuard implements CanActivate {
  constructor(
    private databaseService: DatabaseService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkConfiguration();
  }

  private checkConfiguration(): Observable<boolean> {
    return new Observable(observer => {
      console.log('ConfigGuard: Checking configuration...');
      this.databaseService.getConfigurationValue('dolibarr_url').then(url => {
        console.log('ConfigGuard: dolibarr_url =', url);
        if (url && this.isValidUrl(url)) {
          // URL is configured and valid, redirect to login
          console.log('ConfigGuard: URL configured, redirecting to login');
          this.router.navigate(['/login']);
          observer.next(false);
          observer.complete();
        } else {
          // URL not configured or invalid, allow access to config page
          console.log('ConfigGuard: URL not configured, allowing access to config');
          observer.next(true);
          observer.complete();
        }
      }).catch(error => {
        console.error('Error checking configuration:', error);
        // On error, allow access to config page
        observer.next(true);
        observer.complete();
      });
    });
  }

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
