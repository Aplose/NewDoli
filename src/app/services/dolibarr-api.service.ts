import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { DatabaseService } from './database.service';
import { DolibarrLoginResponse, DolibarrUser } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DolibarrApiService {
  private readonly API_VERSION = 'v1';
  private readonly LOGIN_ENDPOINT = 'login';
  private readonly USER_ENDPOINT = 'users';

  constructor(
    private http: HttpClient,
    private databaseService: DatabaseService
  ) {}

  /**
   * Authenticate user with Dolibarr API
   */
  login(login: string, password: string): Observable<DolibarrLoginResponse> {
    return this.getApiUrl$(this.LOGIN_ENDPOINT).pipe(
      switchMap(url => {
        const body = {
          login: login,
          password: password
        };

        const headers = new HttpHeaders({
          'Content-Type': 'application/json'
        });

        return this.http.post<DolibarrLoginResponse>(url, body, { headers });
      }),
      map(response => {
        if (response.success && response.success.token) {
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
   * Get user information from Dolibarr API with permissions
   */
  getUserInfo(token: string): Observable<DolibarrUser> {
    return this.getApiUrl$(`${this.USER_ENDPOINT}/info`).pipe(
      switchMap(url => {
        const headers = new HttpHeaders({
          'DOLAPIKEY': token,
          'Content-Type': 'application/json'
        });

        // Add includepermissions parameter to get user permissions
        const urlWithParams = `${url}?includepermissions=1`;

        return this.http.get<DolibarrUser>(urlWithParams, { headers });
      }),
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
    return this.getApiUrl$(`${this.USER_ENDPOINT}/info`).pipe(
      switchMap(url => {
        const headers = new HttpHeaders({
          'DOLAPIKEY': token,
          'Content-Type': 'application/json'
        });

        return this.http.get(url, { headers });
      }),
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
    return this.getApiUrl$(this.USER_ENDPOINT).pipe(
      switchMap(url => {
        const headers = new HttpHeaders({
          'DOLAPIKEY': token,
          'Content-Type': 'application/json'
        });

        return this.http.get<DolibarrUser[]>(url, { headers });
      }),
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
    return this.getApiUrl$('thirdparties').pipe(
      switchMap(url => {
        const headers = new HttpHeaders({
          'DOLAPIKEY': token,
          'Content-Type': 'application/json'
        });

        return this.http.get<any[]>(url, { headers });
      }),
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
    return this.getApiUrl$('groups').pipe(
      switchMap(url => {
        const headers = new HttpHeaders({
          'DOLAPIKEY': token,
          'Content-Type': 'application/json'
        });

        return this.http.get<any[]>(url, { headers });
      }),
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
    return this.getApiUrl$('logout').pipe(
      switchMap(url => {
        const headers = new HttpHeaders({
          'DOLAPIKEY': token,
          'Content-Type': 'application/json'
        });

        return this.http.post(url, {}, { headers });
      }),
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
  private async getApiUrl(endpoint: string): Promise<string> {
    const dolibarrUrl = await this.databaseService.getConfigurationValue('dolibarr_url');
    if (!dolibarrUrl) {
      throw new Error('Dolibarr URL not configured');
    }
    
    // Ensure the URL ends with a slash
    const baseUrl = dolibarrUrl.endsWith('/') ? dolibarrUrl : `${dolibarrUrl}/`;
    return `${baseUrl}api/index.php/${endpoint}`;
  }

  /**
   * Get API URL as Observable for a specific endpoint
   */
  private getApiUrl$(endpoint: string): Observable<string> {
    return new Observable(observer => {
      this.getApiUrl(endpoint).then(url => {
        observer.next(url);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Test Dolibarr API connection
   */
  testConnection(): Observable<boolean> {
    return this.getApiUrl$('status').pipe(
      switchMap(url => this.http.get(url)),
      map(() => true),
      catchError(() => {
        return throwError(() => new Error('Cannot connect to Dolibarr API'));
      })
    );
  }
}
