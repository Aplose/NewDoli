import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { ConnectivityState } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  // Main connectivity state signal
  private connectivityState = signal<ConnectivityState>({
    isOnline: navigator.onLine,
    isChecking: false,
    lastCheck: null,
    error: null
  });

  // Public readonly signals
  public readonly isOnline = computed(() => this.connectivityState().isOnline);
  public readonly isChecking = computed(() => this.connectivityState().isChecking);
  public readonly lastCheck = computed(() => this.connectivityState().lastCheck);
  public readonly error = computed(() => this.connectivityState().error);

  // Private methods for state management
  private setChecking(checking: boolean): void {
    this.connectivityState.update(state => ({ ...state, isChecking: checking }));
  }

  private setError(error: string | null): void {
    this.connectivityState.update(state => ({ ...state, error }));
  }

  private setConnectivityState(updates: Partial<ConnectivityState>): void {
    this.connectivityState.update(state => ({ ...state, ...updates }));
  }

  constructor() {
    // Listen to online/offline events
    window.addEventListener('online', () => {
      console.log('Network: Online');
      this.setConnectivityState({
        isOnline: true,
        lastCheck: new Date(),
        error: null
      });
    });

    window.addEventListener('offline', () => {
      console.log('Network: Offline');
      this.setConnectivityState({
        isOnline: false,
        lastCheck: new Date(),
        error: null
      });
    });

    // Effect to log connectivity changes
    effect(() => {
      const state = this.connectivityState();
      console.log('Connectivity state changed:', {
        isOnline: state.isOnline,
        isChecking: state.isChecking,
        lastCheck: state.lastCheck,
        error: state.error
      });
    });
  }

  /**
   * Check if the application is online by testing a network request
   */
  async checkConnectivity(): Promise<boolean> {
    this.setChecking(true);
    this.setError(null);

    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors'
      });

      const isOnline = response.ok || response.type === 'opaque';
      
      this.setConnectivityState({
        isOnline,
        isChecking: false,
        lastCheck: new Date(),
        error: null
      });

      return isOnline;
    } catch (error) {
      console.warn('Connectivity check failed:', error);
      
      this.setConnectivityState({
        isOnline: false,
        isChecking: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Connectivity check failed'
      });

      return false;
    }
  }

  /**
   * Check if a specific URL is reachable
   */
  async checkUrlReachability(url: string): Promise<boolean> {
    this.setChecking(true);
    this.setError(null);

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'cors'
      });

      const isReachable = response.ok;
      
      this.setConnectivityState({
        isOnline: isReachable,
        isChecking: false,
        lastCheck: new Date(),
        error: isReachable ? null : `URL not reachable: ${response.status}`
      });

      return isReachable;
    } catch (error) {
      console.warn('URL reachability check failed:', error);
      
      this.setConnectivityState({
        isOnline: false,
        isChecking: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'URL not reachable'
      });

      return false;
    }
  }

  /**
   * Get current connectivity state
   */
  getConnectivityState(): ConnectivityState {
    return this.connectivityState();
  }
}
