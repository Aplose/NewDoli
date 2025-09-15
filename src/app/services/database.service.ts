import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';

// Define interfaces for our data models
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
  notes?: string;
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

export interface Configuration {
  id?: number;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  created_at: Date;
  updated_at: Date;
}

// Define the database schema
export class NewDoliDatabase extends Dexie {
  users!: Table<User>;
  groups!: Table<Group>;
  permissions!: Table<Permission>;
  thirdParties!: Table<ThirdParty>;
  fieldVisibility!: Table<FieldVisibility>;
  syncLog!: Table<SyncLog>;
  configurations!: Table<Configuration>;

  constructor() {
    super('NewDoliDatabase');
    
    this.version(1).stores({
      users: '++id, login, email, admin, active, created_at, updated_at, last_login',
      groups: '++id, name, created_at, updated_at',
      permissions: '++id, name, module, created_at',
      thirdParties: '++id, name, name_alias, email, client, supplier, prospect, status, created_at, updated_at, last_contact',
      fieldVisibility: '++id, user_id, entity_type, field_name, visible, created_at, updated_at',
      syncLog: '++id, entity_type, entity_id, action, synced, created_at, synced_at',
      configurations: '++id, key, type, created_at, updated_at'
    });

    // Add hooks for automatic timestamps
    this.users.hook('creating', function (primKey, obj, trans) {
      obj.created_at = new Date();
      obj.updated_at = new Date();
    });

    this.users.hook('updating', function (modifications: any, primKey, obj, trans) {
      modifications.updated_at = new Date();
    });

    this.groups.hook('creating', function (primKey, obj, trans) {
      obj.created_at = new Date();
      obj.updated_at = new Date();
    });

    this.groups.hook('updating', function (modifications: any, primKey, obj, trans) {
      modifications.updated_at = new Date();
    });

    this.thirdParties.hook('creating', function (primKey, obj, trans) {
      obj.created_at = new Date();
      obj.updated_at = new Date();
    });

    this.thirdParties.hook('updating', function (modifications: any, primKey, obj, trans) {
      modifications.updated_at = new Date();
    });

    this.fieldVisibility.hook('creating', function (primKey, obj, trans) {
      obj.created_at = new Date();
      obj.updated_at = new Date();
    });

    this.fieldVisibility.hook('updating', function (modifications: any, primKey, obj, trans) {
      modifications.updated_at = new Date();
    });

    this.syncLog.hook('creating', function (primKey, obj, trans) {
      obj.created_at = new Date();
    });

    this.configurations.hook('creating', function (primKey, obj, trans) {
      obj.created_at = new Date();
      obj.updated_at = new Date();
    });

    this.configurations.hook('updating', function (modifications: any, primKey, obj, trans) {
      modifications.updated_at = new Date();
    });
  }
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private db = new NewDoliDatabase();

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await this.db.open();
      console.log('Database initialized successfully');
      
      // Initialize default data if needed
      await this.initializeDefaultData();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  private async initializeDefaultData(): Promise<void> {
    // Check if we have any users, if not, create a default admin user
    const userCount = await this.db.users.count();
    if (userCount === 0) {
      await this.db.users.add({
        login: 'admin',
        firstname: 'Administrator',
        lastname: 'User',
        email: 'admin@newdoli.local',
        admin: true,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Initialize default permissions
    const permissionCount = await this.db.permissions.count();
    if (permissionCount === 0) {
      const defaultPermissions = [
        { name: 'user_read', description: 'Read users', module: 'user', created_at: new Date() },
        { name: 'user_write', description: 'Write users', module: 'user', created_at: new Date() },
        { name: 'user_delete', description: 'Delete users', module: 'user', created_at: new Date() },
        { name: 'thirdparty_read', description: 'Read third parties', module: 'thirdparty', created_at: new Date() },
        { name: 'thirdparty_write', description: 'Write third parties', module: 'thirdparty', created_at: new Date() },
        { name: 'thirdparty_delete', description: 'Delete third parties', module: 'thirdparty', created_at: new Date() },
        { name: 'group_read', description: 'Read groups', module: 'group', created_at: new Date() },
        { name: 'group_write', description: 'Write groups', module: 'group', created_at: new Date() },
        { name: 'group_delete', description: 'Delete groups', module: 'group', created_at: new Date() }
      ];
      
      await this.db.permissions.bulkAdd(defaultPermissions);
    }
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return await this.db.users.toArray();
  }

  async getUser(id: number): Promise<User | undefined> {
    return await this.db.users.get(id);
  }

  async getUserByLogin(login: string): Promise<User | undefined> {
    return await this.db.users.where('login').equals(login).first();
  }

  async addUser(user: Omit<User, 'id'>): Promise<number> {
    return await this.db.users.add(user as User);
  }

  async updateUser(id: number, user: Partial<User>): Promise<number> {
    return await this.db.users.update(id, user);
  }

  async deleteUser(id: number): Promise<void> {
    await this.db.users.delete(id);
  }

  // Group methods
  async getGroups(): Promise<Group[]> {
    return await this.db.groups.toArray();
  }

  async getGroup(id: number): Promise<Group | undefined> {
    return await this.db.groups.get(id);
  }

  async addGroup(group: Omit<Group, 'id'>): Promise<number> {
    return await this.db.groups.add(group as Group);
  }

  async updateGroup(id: number, group: Partial<Group>): Promise<number> {
    return await this.db.groups.update(id, group);
  }

  async deleteGroup(id: number): Promise<void> {
    await this.db.groups.delete(id);
  }

  // Permission methods
  async getPermissions(): Promise<Permission[]> {
    return await this.db.permissions.toArray();
  }

  async getPermissionsByModule(module: string): Promise<Permission[]> {
    return await this.db.permissions.where('module').equals(module).toArray();
  }

  // Third Party methods
  async getThirdParties(): Promise<ThirdParty[]> {
    return await this.db.thirdParties.toArray();
  }

  async getThirdParty(id: number): Promise<ThirdParty | undefined> {
    return await this.db.thirdParties.get(id);
  }

  async addThirdParty(thirdParty: Omit<ThirdParty, 'id'>): Promise<number> {
    return await this.db.thirdParties.add(thirdParty as ThirdParty);
  }

  async updateThirdParty(id: number, thirdParty: Partial<ThirdParty>): Promise<number> {
    return await this.db.thirdParties.update(id, thirdParty);
  }

  async deleteThirdParty(id: number): Promise<void> {
    await this.db.thirdParties.delete(id);
  }

  // Field Visibility methods
  async getFieldVisibility(userId?: number): Promise<FieldVisibility[]> {
    if (userId) {
      return await this.db.fieldVisibility.where('user_id').equals(userId).toArray();
    }
    return await this.db.fieldVisibility.filter(item => item.user_id === null || item.user_id === undefined).toArray();
  }

  async setFieldVisibility(visibility: Omit<FieldVisibility, 'id'>): Promise<number> {
    return await this.db.fieldVisibility.add(visibility as FieldVisibility);
  }

  async updateFieldVisibility(id: number, visibility: Partial<FieldVisibility>): Promise<number> {
    return await this.db.fieldVisibility.update(id, visibility);
  }

  // Sync methods
  async addSyncLog(log: Omit<SyncLog, 'id'>): Promise<number> {
    return await this.db.syncLog.add(log as SyncLog);
  }

  async getPendingSyncLogs(): Promise<SyncLog[]> {
    return await this.db.syncLog.where('synced').equals(0).toArray();
  }

  async markSyncLogAsSynced(id: number): Promise<number> {
    return await this.db.syncLog.update(id, { synced: true, synced_at: new Date() });
  }

  // Utility methods
  // Configuration methods
  async getConfiguration(key: string): Promise<Configuration | undefined> {
    return await this.db.configurations.where('key').equals(key).first();
  }

  async getConfigurationValue(key: string, defaultValue?: any): Promise<any> {
    const config = await this.getConfiguration(key);
    if (!config) {
      return defaultValue;
    }

    switch (config.type) {
      case 'string':
        return config.value;
      case 'number':
        return parseFloat(config.value);
      case 'boolean':
        return config.value === 'true';
      case 'json':
        try {
          return JSON.parse(config.value);
        } catch {
          return defaultValue;
        }
      default:
        return config.value;
    }
  }

  async setConfiguration(key: string, value: any, type: 'string' | 'number' | 'boolean' | 'json' = 'string', description?: string): Promise<number> {
    const existingConfig = await this.getConfiguration(key);
    
    let stringValue: string;
    switch (type) {
      case 'string':
        stringValue = String(value);
        break;
      case 'number':
        stringValue = String(value);
        break;
      case 'boolean':
        stringValue = String(value);
        break;
      case 'json':
        stringValue = JSON.stringify(value);
        break;
      default:
        stringValue = String(value);
    }

    if (existingConfig) {
      return await this.db.configurations.update(existingConfig.id!, {
        value: stringValue,
        type: type,
        description: description,
        updated_at: new Date()
      });
    } else {
      return await this.db.configurations.add({
        key: key,
        value: stringValue,
        type: type,
        description: description,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }

  async getAllConfigurations(): Promise<Configuration[]> {
    return await this.db.configurations.toArray();
  }

  async deleteConfiguration(key: string): Promise<void> {
    const config = await this.getConfiguration(key);
    if (config) {
      await this.db.configurations.delete(config.id!);
    }
  }

  async clearAllData(): Promise<void> {
    await this.db.transaction('rw', [
      this.db.users,
      this.db.groups,
      this.db.permissions,
      this.db.thirdParties,
      this.db.fieldVisibility,
      this.db.syncLog,
      this.db.configurations
    ], async () => {
      await this.db.users.clear();
      await this.db.groups.clear();
      await this.db.permissions.clear();
      await this.db.thirdParties.clear();
      await this.db.fieldVisibility.clear();
      await this.db.syncLog.clear();
      await this.db.configurations.clear();
    });
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}
