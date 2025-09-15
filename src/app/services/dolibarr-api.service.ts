import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';

export interface DolibarrLoginResponse {
  success: boolean;
  token?: string;
  error?: string;
  user?: {
    id: number;
    login: string;
    firstname: string;
    lastname: string;
    email: string;
    admin: boolean;
    active: boolean;
  };
}

export interface DolibarrUser {
  id: number;
  login: string;
  firstname: string;
  lastname: string;
  email: string;
  admin: boolean;
  active: boolean;
  groups?: number[];
  permissions?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DolibarrApiService {
  private readonly API_VERSION = 'v1';
  private readonly LOGIN_ENDPOINT = 'login';
  private readonly USER_ENDPOINT = 'users';

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  /**
   * Authenticate user with Dolibarr API
   */
  login(login: string, password: string): Observable<DolibarrLoginResponse> {
    const url = this.getApiUrl(this.LOGIN_ENDPOINT);
    
    const body = {
      login: login,
      password: password
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<DolibarrLoginResponse>(url, body, { headers }).pipe(
      map(response => {
        if (response.success && response.token) {
          return response;
        } else {
          throw new Error(response.error || 'Login failed');
        }
      }),
      catchError(error => {
        console.error('Dolibarr API login error:', error);
        return throwError(() => new Error(error.error?.error || 'Login failed'));
      })
    );
  }

  /**
   * Get user information from Dolibarr API
   */
  getUserInfo(token: string): Observable<DolibarrUser> {
    const url = this.getApiUrl(`${this.USER_ENDPOINT}/me`);
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<DolibarrUser>(url, { headers }).pipe(
      catchError(error => {
        console.error('Dolibarr API user info error:', error);
        return throwError(() => new Error('Failed to get user information'));
      })
    );
  }

  /**
   * Test if token is still valid
   */
  validateToken(token: string): Observable<boolean> {
    const url = this.getApiUrl(`${this.USER_ENDPOINT}/me`);
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get(url, { headers }).pipe(
      map(() => true),
      catchError(() => {
        return throwError(() => new Error('Token is invalid'));
      })
    );
  }

  /**
   * Get users list from Dolibarr API
   */
  getUsers(token: string): Observable<DolibarrUser[]> {
    const url = this.getApiUrl(this.USER_ENDPOINT);
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<DolibarrUser[]>(url, { headers }).pipe(
      catchError(error => {
        console.error('Dolibarr API get users error:', error);
        return throwError(() => new Error('Failed to get users'));
      })
    );
  }

  /**
   * Get third parties from Dolibarr API
   */
  getThirdParties(token: string): Observable<any[]> {
    const url = this.getApiUrl('thirdparties');
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any[]>(url, { headers }).pipe(
      catchError(error => {
        console.error('Dolibarr API get third parties error:', error);
        return throwError(() => new Error('Failed to get third parties'));
      })
    );
  }

  /**
   * Get groups from Dolibarr API
   */
  getGroups(token: string): Observable<any[]> {
    const url = this.getApiUrl('groups');
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any[]>(url, { headers }).pipe(
      catchError(error => {
        console.error('Dolibarr API get groups error:', error);
        return throwError(() => new Error('Failed to get groups'));
      })
    );
  }

  /**
   * Logout from Dolibarr API
   */
  logout(token: string): Observable<any> {
    const url = this.getApiUrl('logout');
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(url, {}, { headers }).pipe(
      catchError(error => {
        console.error('Dolibarr API logout error:', error);
        // Don't throw error for logout, just log it
        return throwError(() => new Error('Logout failed'));
      })
    );
  }

  /**
   * Get API URL for a specific endpoint
   */
  private getApiUrl(endpoint: string): string {
    const baseUrl = this.configService.getApiUrl();
    return `${baseUrl}${endpoint}`;
  }

  /**
   * Test Dolibarr API connection
   */
  testConnection(): Observable<boolean> {
    const url = this.getApiUrl('status');
    
    return this.http.get(url).pipe(
      map(() => true),
      catchError(() => {
        return throwError(() => new Error('Cannot connect to Dolibarr API'));
      })
    );
  }
}
