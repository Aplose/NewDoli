import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { DatabaseService } from './database.service';
import { DolibarrApiService } from './dolibarr-api.service';
import { ConfigService } from './config.service';
import { LoginCredentials, AuthState, User } from '../models';
import { DolibarrUser } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Inject services using inject() function
  private databaseService = inject(DatabaseService);
  private dolibarrApiService = inject(DolibarrApiService);
  private configService = inject(ConfigService);
  private router = inject(Router);

  // Main auth state signal
  public authState = signal<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    permissions: [],
    rights: {},
    isLoading: false,
    error: null
  });

  // Public readonly signals
  public readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  public readonly currentUser = computed(() => this.authState().user);
  public readonly userPermissions = computed(() => this.authState().permissions);
  public readonly userRights = computed(() => this.authState().rights);
  public readonly isLoading = computed(() => this.authState().isLoading);
  public readonly error = computed(() => this.authState().error);
  public readonly isAdmin = computed(() => this.currentUser()?.admin || false);

  // Signal-based state management methods
  private setLoading(loading: boolean): void {
    this.authState.update(state => ({ ...state, isLoading: loading }));
  }

  private setError(error: string | null): void {
    this.authState.update(state => ({ ...state, error }));
  }

  private setAuthState(updates: Partial<AuthState>): void {
    this.authState.update(state => ({ ...state, ...updates }));
  }

  // Method to check if user is authenticated based on Dolibarr token
  async isUserAuthenticated(): Promise<boolean> {
    try {
      const dolibarrApiKey = await this.databaseService.getConfigurationValue(this.DOLIBARR_API_KEY);
      if (dolibarrApiKey) {
        // If we have a Dolibarr API key, check if it's valid
        try {
          await this.dolibarrApiService.validateToken(dolibarrApiKey).toPromise();
          
          // If API key is valid, try to load user info if not already loaded
          if (!this.authState().isAuthenticated) {
            await this.loadUserInfoFromStorage();
          }
          
          return true;
        } catch (error) {
          console.warn('Dolibarr API key is invalid:', error);
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  private readonly AUTH_TOKEN_KEY = 'newdoli_auth_token';
  private readonly USER_DATA_KEY = 'newdoli_user_data';
  private readonly DOLIBARR_API_KEY = 'dolibarr_api_key';

  // Method to load user info from storage
  private async loadUserInfoFromStorage(): Promise<void> {
    try {
      console.log('Loading user info from storage...');
      const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
      const userInfoConfig = await this.databaseService.getConfigurationValue('user-info');
      
      console.log('Storage data:', {
        hasToken: !!token,
        hasUserInfo: !!userInfoConfig,
        userInfoType: typeof userInfoConfig,
        userInfoKeys: userInfoConfig ? Object.keys(userInfoConfig) : []
      });
      
      if (token && userInfoConfig) {
        // userInfoConfig is already parsed by getConfigurationValue
        const userInfo = userInfoConfig;
        
        console.log('User info from storage:', {
          user: userInfo.user,
          permissions: userInfo.permissions,
          rights: userInfo.rights
        });
        
        // Restore auth state using signals
        this.setAuthState({
          isAuthenticated: true,
          user: userInfo.user,
          token: token,
          permissions: userInfo.permissions || [],
          rights: userInfo.rights || {},
          isLoading: false,
          error: null
        });
        
        console.log('User info loaded from storage:', {
          user: userInfo.user?.login,
          admin: userInfo.user?.admin,
          permissions: userInfo.permissions?.length || 0,
          rights: Object.keys(userInfo.rights || {}).length
        });
      } else {
        console.log('No user info found in storage');
      }
    } catch (error) {
      console.error('Error loading user info from storage:', error);
    }
  }

  constructor() {
    this.initializeAuth();
    
    // Effect to handle auth state changes
    effect(() => {
      const state = this.authState();
      console.log('Auth state changed:', {
        isAuthenticated: state.isAuthenticated,
        user: state.user?.login,
        isLoading: state.isLoading,
        error: state.error
      });
    });
  }

  private async initializeAuth(): Promise<void> {
    try {
      // First check if Dolibarr API key exists in database
      const dolibarrApiKey = await this.databaseService.getConfigurationValue(this.DOLIBARR_API_KEY);
      
      if (dolibarrApiKey) {
        try {
          // Test if API key is still valid
          await this.dolibarrApiService.validateToken(dolibarrApiKey).toPromise();
          
          // API key is valid, load user info from storage
          await this.loadUserInfoFromStorage();
        } catch (error) {
          console.warn('Dolibarr API key is invalid, clearing auth data');
          this.clearAuthData();
        }
      } else {
        // No Dolibarr API key, clear auth data
        this.clearAuthData();
      }
    } catch (error) {
      console.error('Error checking Dolibarr API key:', error);
      this.clearAuthData();
    }
  }

  async login(credentials: LoginCredentials): Promise<boolean> {
    this.setLoading(true);
    this.setError(null);
    
    try {
      // Authenticate with Dolibarr API
      const response = await this.dolibarrApiService.login(credentials.login, credentials.password).toPromise();
      
      if (response && response.success && response.success.token) {
        // Perform login operations synchronously
        const success = await this.performLogin(response.success.token, credentials);
        this.setLoading(false);
        return success;
      } else {
        throw new Error(response?.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      this.setError(error.message || 'Login failed');
      this.setLoading(false);
      throw new Error(error.message || 'Login failed');
    }
  }

  private async performLogin(dolibarrApiKey: string, credentials: LoginCredentials): Promise<boolean> {
    try {
      // Store Dolibarr API key in configuration
      await this.databaseService.setConfiguration(
        this.DOLIBARR_API_KEY,
        dolibarrApiKey,
        'string',
        'Dolibarr API key'
      );

      // Get real user information from Dolibarr API with permissions
      const userInfo = await this.dolibarrApiService.getUserInfo(dolibarrApiKey).toPromise();
      
      if (!userInfo) {
        throw new Error('Failed to get user information');
      }

      const user: User = {
        id: userInfo.id,
        login: userInfo.login,
        firstname: userInfo.firstname || '',
        lastname: userInfo.lastname || '',
        email: userInfo.email || '',
        admin: userInfo.admin || false,
        active: userInfo.active || false,
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

      // Extract permissions and rights from userInfo
      const permissions = userInfo.permissions || [];
      const rights = userInfo.rights || {};

      // Generate local token for session management
      const localToken = this.generateToken(user);

      // Store user info in configuration
      await this.databaseService.setConfiguration(
        'user-info',
        { user, permissions, rights },
        'json',
        'Current user information with permissions'
      );

      // Update auth state using signals
      this.setAuthState({
        isAuthenticated: true,
        user: user,
        token: localToken,
        permissions: permissions,
        rights: rights,
        isLoading: false,
        error: null
      });

      // Store in localStorage
      this.storeAuthData(localToken, user);

      return true;
    } catch (error) {
      console.error('Error during login process:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.setLoading(true);
    this.setError(null);
    
    try {
      // Get Dolibarr API key and logout from API
      const dolibarrApiKey = await this.databaseService.getConfigurationValue(this.DOLIBARR_API_KEY);
      if (dolibarrApiKey) {
        try {
          await this.dolibarrApiService.logout(dolibarrApiKey).toPromise();
        } catch (error) {
          console.warn('Failed to logout from Dolibarr API:', error);
        }
      }

      // Clear Dolibarr API key from configuration
      await this.databaseService.setConfiguration(this.DOLIBARR_API_KEY, '', 'string');
      
      // Clear user info from configuration
      await this.databaseService.setConfiguration('user-info', '', 'string');
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      // Clear local auth data
      this.clearAuthData();
      this.setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        permissions: [],
        rights: {},
        isLoading: false,
        error: null
      });
      
      // Redirect to login page
      this.router.navigate(['/login']);
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
    
    // Update auth state to clear all data
    this.setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      permissions: [],
      rights: {},
      isLoading: false,
      error: null
    });
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
    const user = this.currentUser();
    const rights = this.userRights();
    const permissions = this.userPermissions();
    
    console.log(`Checking access for module '${module}':`, {
      user: user?.login,
      admin: user?.admin,
      permissions: permissions,
      rights: rights,
      moduleRights: rights[module]
    });
    
    // Admin users have access to all modules
    if (user?.admin) {
      console.log(`Access granted to '${module}': User is admin`);
      return true;
    }
    
    // Check if user has rights for this module
    if (rights[module] && rights[module].length > 0) {
      console.log(`Access granted to '${module}': User has rights`);
      return true;
    }
    
    // Check permissions for backward compatibility
    const hasPermission = permissions.some(permission => 
      permission.startsWith(`${module}_`) || 
      permission === `${module}_all`
    );
    
    console.log(`Access to '${module}': ${hasPermission ? 'granted' : 'denied'} (permissions check)`);
    return hasPermission;
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
