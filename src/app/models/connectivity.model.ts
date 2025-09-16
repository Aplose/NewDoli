/**
 * Connectivity Models
 * 
 * This file contains all interfaces related to network connectivity
 * and online/offline state management in the NewDoli application.
 */

export interface ConnectivityState {
  isOnline: boolean;
  isChecking: boolean;
  lastCheck: Date | null;
  error: string | null;
}
