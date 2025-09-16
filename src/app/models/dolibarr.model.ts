/**
 * Dolibarr API Models
 * 
 * This file contains all interfaces related to Dolibarr API
 * communication and data structures in the NewDoli application.
 */

export interface DolibarrLoginResponse {
  success: {
    code: number;
    token: string;
    entity: string;
    message: string;
  };
  error?: string;
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
  rights?: {
    [module: string]: string[];
  };
}
