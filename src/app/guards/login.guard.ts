import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { DatabaseService } from '../services/database.service';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  constructor(
    private databaseService: DatabaseService,
    private authService: AuthService,
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
      // First check if user is already authenticated
      this.authService.isUserAuthenticated().then(isAuthenticated => {
        if (isAuthenticated) {
          // User is already logged in, redirect to dashboard
          this.router.navigate(['/dashboard']);
          observer.next(false);
          observer.complete();
          return;
        }

        // Check if Dolibarr URL is configured
        this.databaseService.getConfigurationValue('dolibarr_url').then(url => {
          if (url && this.isValidUrl(url)) {
            // URL is configured and valid, allow access to login
            observer.next(true);
            observer.complete();
          } else {
            // URL not configured or invalid, redirect to config
            this.router.navigate(['/config']);
            observer.next(false);
            observer.complete();
          }
        }).catch(error => {
          console.error('Error checking configuration:', error);
          // On error, redirect to config
          this.router.navigate(['/config']);
          observer.next(false);
          observer.complete();
        });
      }).catch(error => {
        console.error('Error checking authentication:', error);
        // On error, redirect to config
        this.router.navigate(['/config']);
        observer.next(false);
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
