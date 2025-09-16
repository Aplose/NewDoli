import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  // Inject database service using inject() function
  private databaseService = inject(DatabaseService);

  private configState = signal<{
    dolibarrUrl: string | null;
    isConfigured: boolean;
    isLoading: boolean;
    error: string | null;
  }>({
    dolibarrUrl: null,
    isConfigured: false,
    isLoading: false,
    error: null
  });

  // Public readonly signals
  public readonly dolibarrUrl = computed(() => this.configState().dolibarrUrl);
  public readonly isConfigured = computed(() => this.configState().isConfigured);
  public readonly isLoading = computed(() => this.configState().isLoading);
  public readonly error = computed(() => this.configState().error);

  private readonly DOLIBARR_URL_KEY = 'dolibarr_url';

  constructor() {
    this.initializeConfig();
    
    // Effect to handle config state changes
    effect(() => {
      const state = this.configState();
      console.log('Config state changed:', {
        dolibarrUrl: state.dolibarrUrl,
        isConfigured: state.isConfigured,
        isLoading: state.isLoading,
        error: state.error
      });
    });
  }

  // Signal-based state management methods
  private setLoading(loading: boolean): void {
    this.configState.update(state => ({ ...state, isLoading: loading }));
  }

  private setError(error: string | null): void {
    this.configState.update(state => ({ ...state, error }));
  }

  private setConfigState(updates: Partial<{
    dolibarrUrl: string | null;
    isConfigured: boolean;
    isLoading: boolean;
    error: string | null;
  }>): void {
    this.configState.update(state => ({ ...state, ...updates }));
  }

  private async initializeConfig(): Promise<void> {
    this.setLoading(true);
    this.setError(null);
    
    try {
      const url = await this.databaseService.getConfigurationValue(this.DOLIBARR_URL_KEY);
      this.setConfigState({
        dolibarrUrl: url || null,
        isConfigured: !!url,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading configuration:', error);
      this.setConfigState({
        dolibarrUrl: null,
        isConfigured: false,
        isLoading: false,
        error: 'Failed to load configuration'
      });
    }
  }

  async setDolibarrUrl(url: string): Promise<void> {
    this.setLoading(true);
    this.setError(null);
    
    try {
      // Validate URL format
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid URL format');
      }

      // Ensure URL ends with /
      const normalizedUrl = url.endsWith('/') ? url : url + '/';

      await this.databaseService.setConfiguration(
        this.DOLIBARR_URL_KEY,
        normalizedUrl,
        'string',
        'Dolibarr server URL'
      );

      this.setConfigState({
        dolibarrUrl: normalizedUrl,
        isConfigured: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error setting Dolibarr URL:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to set URL');
      this.setLoading(false);
      throw error;
    }
  }

  async updateDolibarrUrl(url: string): Promise<void> {
    return this.setDolibarrUrl(url);
  }

  async getDolibarrUrl(): Promise<string | null> {
    // Return from signal state if available, otherwise fetch from database
    const currentUrl = this.dolibarrUrl();
    if (currentUrl) {
      return currentUrl;
    }
    
    try {
      const url = await this.databaseService.getConfigurationValue(this.DOLIBARR_URL_KEY);
      if (url) {
        this.setConfigState({
          dolibarrUrl: url,
          isConfigured: true
        });
      }
      return url;
    } catch (error) {
      console.error('Error getting Dolibarr URL:', error);
      return null;
    }
  }

  async clearDolibarrUrl(): Promise<void> {
    this.setLoading(true);
    this.setError(null);
    
    try {
      await this.databaseService.deleteConfiguration(this.DOLIBARR_URL_KEY);
      this.setConfigState({
        dolibarrUrl: null,
        isConfigured: false,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error clearing Dolibarr URL:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to clear URL');
      this.setLoading(false);
      throw error;
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // Method to check if configuration is complete
  async isConfigurationComplete(): Promise<boolean> {
    const url = await this.getDolibarrUrl();
    return !!url && this.isValidUrl(url);
  }

  // Method to get API endpoint URL
  getApiUrl(endpoint: string = ''): string {
    const baseUrl = this.dolibarrUrl();
    if (!baseUrl) {
      throw new Error('Dolibarr URL not configured');
    }
    return `${baseUrl}api/index.php/${endpoint}`.replace(/\/+/g, '/');
  }

  // Method to get web URL
  getWebUrl(path: string = ''): string {
    const baseUrl = this.dolibarrUrl();
    if (!baseUrl) {
      throw new Error('Dolibarr URL not configured');
    }
    return `${baseUrl}${path}`.replace(/\/+/g, '/');
  }

  // Method to refresh configuration from database
  async refreshConfig(): Promise<void> {
    await this.initializeConfig();
  }
}
