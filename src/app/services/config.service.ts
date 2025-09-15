import { Injectable, signal, computed } from '@angular/core';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private configState = signal<{
    dolibarrUrl: string | null;
    isConfigured: boolean;
  }>({
    dolibarrUrl: null,
    isConfigured: false
  });

  // Public readonly signals
  public readonly dolibarrUrl = computed(() => this.configState().dolibarrUrl);
  public readonly isConfigured = computed(() => this.configState().isConfigured);

  private readonly DOLIBARR_URL_KEY = 'dolibarr_url';

  constructor(private databaseService: DatabaseService) {
    this.initializeConfig();
  }

  private async initializeConfig(): Promise<void> {
    try {
      const url = await this.databaseService.getConfigurationValue(this.DOLIBARR_URL_KEY);
      this.configState.set({
        dolibarrUrl: url || null,
        isConfigured: !!url
      });
    } catch (error) {
      console.error('Error loading configuration:', error);
      this.configState.set({
        dolibarrUrl: null,
        isConfigured: false
      });
    }
  }

  async setDolibarrUrl(url: string): Promise<void> {
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

      this.configState.set({
        dolibarrUrl: normalizedUrl,
        isConfigured: true
      });
    } catch (error) {
      console.error('Error setting Dolibarr URL:', error);
      throw error;
    }
  }

  async updateDolibarrUrl(url: string): Promise<void> {
    return this.setDolibarrUrl(url);
  }

  async getDolibarrUrl(): Promise<string | null> {
    return await this.databaseService.getConfigurationValue(this.DOLIBARR_URL_KEY);
  }

  async clearDolibarrUrl(): Promise<void> {
    await this.databaseService.deleteConfiguration(this.DOLIBARR_URL_KEY);
    this.configState.set({
      dolibarrUrl: null,
      isConfigured: false
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
