import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { DatabaseService, User } from './database.service';
import { DolibarrApiService, DolibarrUser } from './dolibarr-api.service';
import { ConfigService } from './config.service';

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  permissions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = signal<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    permissions: []
  });

  // Public readonly signals
  public readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  public readonly currentUser = computed(() => this.authState().user);
  public readonly userPermissions = computed(() => this.authState().permissions);

  private readonly AUTH_TOKEN_KEY = 'newdoli_auth_token';
  private readonly USER_DATA_KEY = 'newdoli_user_data';
  private readonly DOLIBARR_TOKEN_KEY = 'dolibarr_token';

  constructor(
    private databaseService: DatabaseService,
    private dolibarrApiService: DolibarrApiService,
    private configService: ConfigService
  ) {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    // Check for stored authentication data
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const userData = localStorage.getItem(this.USER_DATA_KEY);

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        
        // Validate Dolibarr token if it exists
        const dolibarrToken = await this.databaseService.getConfigurationValue(this.DOLIBARR_TOKEN_KEY);
        if (dolibarrToken) {
          try {
            // Test if token is still valid
            await this.dolibarrApiService.validateToken(dolibarrToken).toPromise();
            
            // Token is valid, restore auth state
            this.authState.set({
              isAuthenticated: true,
              user: user,
              token: token,
              permissions: user.permissions || []
            });
          } catch (error) {
            console.warn('Dolibarr token is invalid, clearing auth data');
            this.clearAuthData();
          }
        } else {
          // No Dolibarr token, clear auth data
          this.clearAuthData();
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.clearAuthData();
      }
    }
  }

  async login(credentials: LoginCredentials): Promise<Observable<boolean>> {
    try {
      // Authenticate with Dolibarr API
      return this.dolibarrApiService.login(credentials.login, credentials.password).pipe(
        switchMap(async (response) => {
          if (response.success && response.token && response.user) {
            // Store Dolibarr token in configuration
            await this.databaseService.setConfiguration(
              this.DOLIBARR_TOKEN_KEY,
              response.token,
              'string',
              'Dolibarr API token'
            );

            // Convert Dolibarr user to local user format
            const user: User = {
              id: response.user.id,
              login: response.user.login,
              firstname: response.user.firstname,
              lastname: response.user.lastname,
              email: response.user.email,
              admin: response.user.admin,
              active: response.user.active,
              created_at: new Date(),
              updated_at: new Date(),
              last_login: new Date()
            };

            // Store or update user in local database
            const existingUser = await this.databaseService.getUser(user.id!);
            if (existingUser) {
              await this.databaseService.updateUser(user.id!, {
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                admin: user.admin,
                active: user.active,
                last_login: new Date()
              });
            } else {
              await this.databaseService.addUser(user);
            }

            // Get user permissions
            const permissions = await this.getUserPermissions(user);

            // Generate local token for session management
            const localToken = this.generateToken(user);

            // Update auth state
            this.authState.set({
              isAuthenticated: true,
              user: user,
              token: localToken,
              permissions: permissions
            });

            // Store in localStorage
            this.storeAuthData(localToken, user);

            return true;
          } else {
            throw new Error(response.error || 'Login failed');
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => new Error(error.message || 'Login failed'));
        })
      );
    } catch (error) {
      return throwError(() => error);
    }
  }

  async logout(): Promise<void> {
    try {
      // Get Dolibarr token and logout from API
      const dolibarrToken = await this.databaseService.getConfigurationValue(this.DOLIBARR_TOKEN_KEY);
      if (dolibarrToken) {
        try {
          await this.dolibarrApiService.logout(dolibarrToken).toPromise();
        } catch (error) {
          console.warn('Failed to logout from Dolibarr API:', error);
        }
      }

      // Clear Dolibarr token from configuration
      await this.databaseService.setConfiguration(this.DOLIBARR_TOKEN_KEY, '', 'string');
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      // Clear local auth data
      this.clearAuthData();
      this.authState.set({
        isAuthenticated: false,
        user: null,
        token: null,
        permissions: []
      });
    }
  }

  private generateToken(user: User): string {
    // Simple token generation - in production, use JWT
    const payload = {
      userId: user.id,
      login: user.login,
      admin: user.admin,
      timestamp: Date.now()
    };
    return btoa(JSON.stringify(payload));
  }

  private storeAuthData(token: string, user: User): void {
    localStorage.setItem(this.AUTH_TOKEN_KEY, token);
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user));
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
  }

  private async getUserPermissions(user: User): Promise<string[]> {
    const permissions: string[] = [];

    // Admin users have all permissions
    if (user.admin) {
      const allPermissions = await this.databaseService.getPermissions();
      return allPermissions.map(p => p.name);
    }

    // Get permissions from user's groups
    if (user.groups && user.groups.length > 0) {
      for (const groupId of user.groups) {
        const group = await this.databaseService.getGroup(groupId);
        if (group) {
          permissions.push(...group.permissions);
        }
      }
    }

    // Add direct user permissions
    if (user.permissions) {
      permissions.push(...user.permissions);
    }

    // Remove duplicates
    return [...new Set(permissions)];
  }

  hasPermission(permission: string): boolean {
    const permissions = this.userPermissions();
    return permissions.includes(permission) || this.currentUser()?.admin === true;
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  isAdmin(): boolean {
    return this.currentUser()?.admin === true;
  }

  async refreshUserData(): Promise<void> {
    const currentUser = this.currentUser();
    if (currentUser && currentUser.id) {
      const updatedUser = await this.databaseService.getUser(currentUser.id);
      if (updatedUser) {
        const permissions = await this.getUserPermissions(updatedUser);
        this.authState.set({
          ...this.authState(),
          user: updatedUser,
          permissions: permissions
        });
        this.storeAuthData(this.authState().token!, updatedUser);
      }
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    const user = this.currentUser();
    if (!user) {
      throw new Error('No user logged in');
    }

    // Verify current password
    if (user.password && user.password !== currentPassword) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    await this.databaseService.updateUser(user.id!, { password: newPassword });
    
    // Update local user data
    const updatedUser = { ...user, password: newPassword };
    this.authState.set({
      ...this.authState(),
      user: updatedUser
    });
    this.storeAuthData(this.authState().token!, updatedUser);

    return true;
  }

  getAuthState(): AuthState {
    return this.authState();
  }

  // Method to check if user can access a specific module
  canAccessModule(module: string): boolean {
    const permissions = this.userPermissions();
    return permissions.some(permission => 
      permission.startsWith(`${module}_`) || 
      permission === `${module}_all` ||
      this.isAdmin()
    );
  }

  // Method to get user's accessible modules
  getAccessibleModules(): string[] {
    const permissions = this.userPermissions();
    const modules = new Set<string>();
    
    permissions.forEach(permission => {
      const parts = permission.split('_');
      if (parts.length >= 2) {
        modules.add(parts[0]);
      }
    });

    return Array.from(modules);
  }
}
