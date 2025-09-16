/**
 * Database Models
 * 
 * This file contains all interfaces related to database entities
 * used throughout the NewDoli application.
 */

export interface User {
  id?: number;
  login: string;
  password?: string;
  firstname: string;
  lastname: string;
  email: string;
  admin: boolean;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  groups?: number[];
  permissions?: string[];
}

export interface Group {
  id?: number;
  name: string;
  description?: string;
  permissions: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Permission {
  id?: number;
  name: string;
  description?: string;
  module: string;
  created_at: Date;
}

export interface ThirdParty {
  id?: number;
  name: string;
  name_alias?: string;
  address?: string;
  zip?: string;
  town?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  client: boolean;
  supplier: boolean;
  prospect: boolean;
  status: 'active' | 'inactive' | 'suspended';
  created_at: Date;
  updated_at: Date;
  last_contact?: Date;
  note_public?: string;
  note_private?: string;
}

export interface FieldVisibility {
  id?: number;
  user_id?: number; // null for global settings
  entity_type: string; // 'user', 'thirdparty', 'group', etc.
  field_name: string;
  visible: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SyncLog {
  id?: number;
  entity_type: string;
  entity_id: number;
  action: 'create' | 'update' | 'delete';
  data: any;
  synced: boolean;
  created_at: Date;
  synced_at?: Date;
  error?: string;
}

export interface Product {
  id?: number;
  ref: string;
  label: string;
  description?: string;
  type: 'product' | 'service';
  price: number;
  priceTTC: number;
  status: number;
  statusLabel: string;
  category: string;
  stock: number;
  stockAlert: number;
  imageUrl?: string;
  created_at: Date;
  updated_at: Date;
  lastModified: Date;
}

export interface Configuration {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  created_at: Date;
  updated_at: Date;
}
