import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAuth(route, state);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAuth(route, state);
  }

  private checkAuth(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return new Observable(observer => {
      console.log('AuthGuard: Checking authentication for route:', state.url);
      // Use the same async method as LoginGuard to avoid conflicts
      this.authService.isUserAuthenticated().then(isAuthenticated => {
        console.log('AuthGuard: isAuthenticated =', isAuthenticated);
        if (isAuthenticated) {
          console.log('AuthGuard: User authenticated, allowing access');
          observer.next(true);
          observer.complete();
        } else {
          // Store the attempted URL for redirecting after login
          console.log('AuthGuard: User not authenticated, redirecting to login');
          this.router.navigate(['/login'], { 
            queryParams: { returnUrl: state.url } 
          });
          observer.next(false);
          observer.complete();
        }
      }).catch(error => {
        console.error('Error checking authentication in AuthGuard:', error);
        console.log('AuthGuard: Error occurred, redirecting to login');
        this.router.navigate(['/login'], { 
          queryParams: { returnUrl: state.url } 
        });
        observer.next(false);
        observer.complete();
      });
    });
  }
}
