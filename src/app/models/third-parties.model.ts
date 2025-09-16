/**
 * Third Parties Models
 * 
 * This file contains all interfaces related to third parties
 * management and search functionality in the NewDoli application.
 */

import { ThirdParty } from './database.model';

export interface ThirdPartySearchResult {
  thirdParties: ThirdParty[];
  totalCount: number;
  searchQuery: string;
  isOnline: boolean;
  lastSync: Date | null;
}

export interface ThirdPartyFilters {
  searchQuery: string;
  client: boolean | null;
  supplier: boolean | null;
  prospect: boolean | null;
  status: string | null;
}
