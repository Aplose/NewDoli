/**
 * Products Models
 * 
 * This file contains all interfaces related to products and services
 * management and search functionality in the NewDoli application.
 */

import { Product } from './database.model';

export interface ProductSearchResult {
  products: Product[];
  totalCount: number;
  searchQuery: string;
  isOnline: boolean;
  lastSync: Date | null;
}

export interface ProductFilters {
  searchQuery: string;
  type: 'product' | 'service' | null;
  status: string | null;
  category: string | null;
}

export interface ProductCardData {
  id: number;
  ref: string;
  label: string;
  description: string;
  type: 'product' | 'service';
  price: number;
  priceTTC: number;
  status: number;
  statusLabel: string;
  category: string;
  stock: number;
  stockAlert: number;
  lastModified: Date;
  imageUrl?: string;
}
