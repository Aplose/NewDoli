import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredPermissions = route.data['permissions'] as string[];
    const requiredPermission = route.data['permission'] as string;
    const requiredModule = route.data['module'] as string;

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      return of(false);
    }

    // Admin users have access to everything
    if (this.authService.isAdmin()) {
      return of(true);
    }

    // Check specific permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!this.authService.hasAllPermissions(requiredPermissions)) {
        this.router.navigate(['/unauthorized']);
        return of(false);
      }
    }

    if (requiredPermission) {
      if (!this.authService.hasPermission(requiredPermission)) {
        this.router.navigate(['/unauthorized']);
        return of(false);
      }
    }

    if (requiredModule) {
      if (!this.authService.canAccessModule(requiredModule)) {
        this.router.navigate(['/unauthorized']);
        return of(false);
      }
    }

    return of(true);
  }
}
