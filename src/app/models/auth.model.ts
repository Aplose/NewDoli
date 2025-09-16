/**
 * Authentication Models
 * 
 * This file contains all interfaces related to authentication
 * and user session management in the NewDoli application.
 */

import { User } from './database.model';

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  permissions: string[];
  rights: { [module: string]: string[] };
  isLoading: boolean;
  error: string | null;
}
