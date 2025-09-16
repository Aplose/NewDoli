import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DatabaseService } from '../services/database.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private databaseService: DatabaseService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip token injection for certain requests
    if (this.shouldSkipToken(req)) {
      return next.handle(req);
    }

    // Get the token from configuration
    const token = this.getStoredToken();
    
    if (token) {
      // Clone the request and add the Dolibarr API key header
      const authReq = req.clone({
        setHeaders: {
          'DOLAPIKEY': token,
          'Content-Type': 'application/json'
        }
      });

      return next.handle(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          if (this.isUnauthorizedError(error)) {
            // Token is invalid, clear auth and redirect to login
            this.handleUnauthorized();
            return throwError(() => error);
          }
          return throwError(() => error);
        })
      );
    }

    return next.handle(req);
  }

  private shouldSkipToken(req: HttpRequest<any>): boolean {
    const url = req.url;
    
    // Skip token for:
    // - Configuration requests
    // - Login requests
    // - External APIs (not Dolibarr)
    // - Static assets
    return (
      url.includes('/config') ||
      url.includes('/login') ||
      url.includes('/api/login') ||
      !this.isDolibarrApiRequest(url) ||
      url.includes('.css') ||
      url.includes('.js') ||
      url.includes('.png') ||
      url.includes('.jpg') ||
      url.includes('.ico')
    );
  }

  private isDolibarrApiRequest(url: string): boolean {
    try {
      // Check if URL contains Dolibarr API patterns
      return url.includes('/api/index.php/') || url.includes('/api/');
    } catch {
      return false;
    }
  }

  private getStoredToken(): string | null {
    try {
      const token = this.authService.authState().token;
      return token;
    } catch {
      return null;
    }
  }

  private isUnauthorizedError(error: HttpErrorResponse): boolean {
    return error.status === 401 || error.status === 403;
  }

  private handleUnauthorized(): void {
    // Clear auth state (this will also clear the token)
    this.authService.logout();
    
    // Redirect to login
    this.router.navigate(['/login']);
  }
}
