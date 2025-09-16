import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { DatabaseService } from './database.service';
import { DolibarrApiService } from './dolibarr-api.service';
import { ConnectivityService } from './connectivity.service';
import { AuthService } from './auth.service';
import { ThirdParty, ThirdPartySearchResult, ThirdPartyFilters } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ThirdPartiesService {
  // Inject services
  private databaseService = inject(DatabaseService);
  private dolibarrApiService = inject(DolibarrApiService);
  private connectivityService = inject(ConnectivityService);
  private authService = inject(AuthService);

  // Main state signal
  private thirdPartiesState = signal<{
    thirdParties: ThirdParty[];
    filteredThirdParties: ThirdParty[];
    searchQuery: string;
    filters: ThirdPartyFilters;
    isLoading: boolean;
    isOnline: boolean;
    lastSync: Date | null;
    error: string | null;
  }>({
    thirdParties: [],
    filteredThirdParties: [],
    searchQuery: '',
    filters: {
      searchQuery: '',
      client: null,
      supplier: null,
      prospect: null,
      status: null
    },
    isLoading: false,
    isOnline: true,
    lastSync: null,
    error: null
  });

  // Public readonly signals
  public readonly thirdParties = computed(() => this.thirdPartiesState().thirdParties);
  public readonly filteredThirdParties = computed(() => this.thirdPartiesState().filteredThirdParties);
  public readonly searchQuery = computed(() => this.thirdPartiesState().searchQuery);
  public readonly filters = computed(() => this.thirdPartiesState().filters);
  public readonly isLoading = computed(() => this.thirdPartiesState().isLoading);
  public readonly lastSync = computed(() => this.thirdPartiesState().lastSync);
  public readonly error = computed(() => this.thirdPartiesState().error);

  // Private methods for state management
  private setLoading(loading: boolean): void {
    this.thirdPartiesState.update(state => ({ ...state, isLoading: loading }));
  }

  private setError(error: string | null): void {
    this.thirdPartiesState.update(state => ({ ...state, error }));
  }

  private setThirdPartiesState(updates: Partial<{
    thirdParties: ThirdParty[];
    filteredThirdParties: ThirdParty[];
    searchQuery: string;
    filters: ThirdPartyFilters;
    isLoading: boolean;
    isOnline: boolean;
    lastSync: Date | null;
    error: string | null;
  }>): void {
    this.thirdPartiesState.update(state => ({ ...state, ...updates }));
  }

  constructor() {
    // Initialize connectivity state
    this.setThirdPartiesState({
      isOnline: this.connectivityService.isOnline()
    });

    // Load initial data asynchronously
    setTimeout(() => {
      this.loadThirdParties().catch(error => {
        console.error('Error loading initial third parties:', error);
      });
    }, 0);
  }

  /**
   * Update connectivity state
   */
  updateConnectivity(): void {
    const isOnline = this.connectivityService.isOnline();
    this.setThirdPartiesState({ isOnline });
  }

  /**
   * Load third parties from appropriate source (online/offline)
   */
  async loadThirdParties(): Promise<void> {
    console.log('Loading third parties');
    this.setLoading(true);
    this.setError(null);

    try {
      // Update connectivity state
      this.updateConnectivity();
      const isOnline = this.connectivityService.isOnline();
      
      if (isOnline) {
        await this.loadThirdPartiesFromApi();
      } else {
        await this.loadThirdPartiesFromStorage();
      }
    } catch (error) {
      console.error('Error loading third parties:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to load third parties');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Load third parties from API and sync with local storage
   */
  private async loadThirdPartiesFromApi(): Promise<void> {
    try {
      // Get Dolibarr API key from database
      const dolibarrApiKey = await this.databaseService.getConfigurationValue('dolibarr_api_key');
      if (!dolibarrApiKey) {
        console.log('No Dolibarr API key available, loading from local storage');
        await this.loadThirdPartiesFromStorage();
        return;
      }

      // Get third parties from Dolibarr API
      const thirdParties = await this.dolibarrApiService.getThirdParties(dolibarrApiKey).toPromise();
      
      if (thirdParties) {
        // Store in local database
        await this.storeThirdParties(thirdParties);
        
        this.setThirdPartiesState({
          thirdParties,
          lastSync: new Date(),
          error: null
        });
        this.applyFilters();
      }
    } catch (error) {
      console.error('Error loading third parties from API:', error);
      // Fallback to local storage
      await this.loadThirdPartiesFromStorage();
    }
  }

  /**
   * Load third parties from local storage
   */
  private async loadThirdPartiesFromStorage(): Promise<void> {
    try {
      const thirdParties = await this.databaseService.getAllThirdParties();
      
      this.setThirdPartiesState({
        thirdParties,
        error: null
      });
      this.applyFilters();
    } catch (error) {
      console.error('Error loading third parties from storage:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to load third parties from storage');
    }
  }

  /**
   * Store third parties in local database
   */
  private async storeThirdParties(thirdParties: ThirdParty[]): Promise<void> {
    try {
      // Clear existing third parties
      await this.databaseService.clearThirdParties();
      
      // Add new third parties
      for (const thirdParty of thirdParties) {
        await this.databaseService.addThirdParty(thirdParty);
      }
    } catch (error) {
      console.error('Error storing third parties:', error);
      throw error;
    }
  }


  /**
   * Search third parties with full-text search
   */
  searchThirdParties(query: string): void {
    this.setThirdPartiesState({
      searchQuery: query,
      filters: {
        ...this.thirdPartiesState().filters,
        searchQuery: query
      }
    });
    this.applyFilters();
  }

  /**
   * Apply filters to third parties
   */
  private applyFilters(): void {
    const { thirdParties, filters } = this.thirdPartiesState();
    
    let filtered = [...thirdParties];

    // Apply search query (full-text search)
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const searchTokens = filters.searchQuery.toLowerCase().trim().split(/\s+/);
      
      filtered = filtered.filter(thirdParty => {
        const searchableText = [
          thirdParty.name,
          thirdParty.name_alias,
          thirdParty.email,
          thirdParty.address,
          thirdParty.zip,
          thirdParty.town,
          thirdParty.phone,
          thirdParty.note_public,
          thirdParty.note_private
        ].join(' ').toLowerCase();

        // All tokens must be present (AND logic)
        return searchTokens.every(token => searchableText.includes(token));
      });
    }

    // Apply client filter
    if (filters.client !== null) {
      filtered = filtered.filter(thirdParty => thirdParty.client === filters.client);
    }

    // Apply supplier filter
    if (filters.supplier !== null) {
      filtered = filtered.filter(thirdParty => thirdParty.supplier === filters.supplier);
    }

    // Apply prospect filter
    if (filters.prospect !== null) {
      filtered = filtered.filter(thirdParty => thirdParty.prospect === filters.prospect);
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(thirdParty => thirdParty.status === filters.status);
    }

    this.setThirdPartiesState({
      filteredThirdParties: filtered
    });
  }

  /**
   * Set filters
   */
  setFilters(filters: Partial<ThirdPartyFilters>): void {
    this.setThirdPartiesState({
      filters: {
        ...this.thirdPartiesState().filters,
        ...filters
      }
    });
    this.applyFilters();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.setThirdPartiesState({
      searchQuery: '',
      filters: {
        searchQuery: '',
        client: null,
        supplier: null,
        prospect: null,
        status: null
      }
    });
    this.applyFilters();
  }

  /**
   * Get search results
   */
  getSearchResults(): ThirdPartySearchResult {
    const state = this.thirdPartiesState();
    
    return {
      thirdParties: state.filteredThirdParties,
      totalCount: state.filteredThirdParties.length,
      searchQuery: state.searchQuery,
      isOnline: state.isOnline,
      lastSync: state.lastSync
    };
  }

  /**
   * Refresh third parties
   */
  async refresh(): Promise<void> {
    await this.loadThirdParties();
  }

  /**
   * Get third party by ID
   */
  async getThirdPartyById(id: number): Promise<ThirdParty | null> {
    try {
      // Get from local storage
      const thirdParty = await this.databaseService.getThirdParty(id);
      return thirdParty || null;
    } catch (error) {
      console.error('Error getting third party by ID:', error);
      return null;
    }
  }
}
