import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { DatabaseService } from './database.service';
import { DolibarrApiService } from './dolibarr-api.service';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  constructor(
    private databaseService: DatabaseService,
    private dolibarrApiService: DolibarrApiService,
    private configService: ConfigService
  ) {}

  /**
   * Sync all data from Dolibarr API to local database
   */
  async syncAllData(): Promise<Observable<any>> {
    try {
      const token = await this.databaseService.getConfigurationValue('dolibarr_token');
      if (!token) {
        throw new Error('No Dolibarr token available');
      }

      return forkJoin({
        users: this.syncUsers(token),
        groups: this.syncGroups(token),
        thirdParties: this.syncThirdParties(token)
      }).pipe(
        map(results => {
          console.log('Sync completed:', results);
          return results;
        }),
        catchError(error => {
          console.error('Sync error:', error);
          throw error;
        })
      );
    } catch (error: any) {
      console.error('Sync setup error:', error);
      return of({ error: error.message });
    }
  }

  /**
   * Sync users from Dolibarr API
   */
  private syncUsers(token: string): Observable<any> {
    return this.dolibarrApiService.getUsers(token).pipe(
      switchMap(async (dolibarrUsers) => {
        const results = [];
        
        for (const dolibarrUser of dolibarrUsers) {
          try {
            const localUser = {
              id: dolibarrUser.id,
              login: dolibarrUser.login,
              firstname: dolibarrUser.firstname,
              lastname: dolibarrUser.lastname,
              email: dolibarrUser.email,
              admin: dolibarrUser.admin,
              active: dolibarrUser.active,
              created_at: new Date(),
              updated_at: new Date()
            };

            const existingUser = await this.databaseService.getUser(dolibarrUser.id);
            if (existingUser) {
              await this.databaseService.updateUser(dolibarrUser.id, localUser);
              results.push({ action: 'updated', user: localUser });
            } else {
              await this.databaseService.addUser(localUser);
              results.push({ action: 'created', user: localUser });
            }
          } catch (error: any) {
            console.error(`Error syncing user ${dolibarrUser.id}:`, error);
            results.push({ action: 'error', user: dolibarrUser, error: error.message });
          }
        }

        return results;
      }),
      catchError(error => {
        console.error('Error syncing users:', error);
        return of({ error: error.message });
      })
    );
  }

  /**
   * Sync groups from Dolibarr API
   */
  private syncGroups(token: string): Observable<any> {
    return this.dolibarrApiService.getGroups(token).pipe(
      switchMap(async (dolibarrGroups) => {
        const results = [];
        
        for (const dolibarrGroup of dolibarrGroups) {
          try {
            const localGroup = {
              id: dolibarrGroup.id,
              name: dolibarrGroup.name,
              description: dolibarrGroup.description || '',
              permissions: dolibarrGroup.permissions || [],
              created_at: new Date(),
              updated_at: new Date()
            };

            const existingGroup = await this.databaseService.getGroup(dolibarrGroup.id);
            if (existingGroup) {
              await this.databaseService.updateGroup(dolibarrGroup.id, localGroup);
              results.push({ action: 'updated', group: localGroup });
            } else {
              await this.databaseService.addGroup(localGroup);
              results.push({ action: 'created', group: localGroup });
            }
          } catch (error: any) {
            console.error(`Error syncing group ${dolibarrGroup.id}:`, error);
            results.push({ action: 'error', group: dolibarrGroup, error: error.message });
          }
        }

        return results;
      }),
      catchError(error => {
        console.error('Error syncing groups:', error);
        return of({ error: error.message });
      })
    );
  }

  /**
   * Sync third parties from Dolibarr API
   */
  private syncThirdParties(token: string): Observable<any> {
    return this.dolibarrApiService.getThirdParties(token).pipe(
      switchMap(async (dolibarrThirdParties) => {
        const results = [];
        
        for (const dolibarrThirdParty of dolibarrThirdParties) {
          try {
            const localThirdParty = {
              id: dolibarrThirdParty.id,
              name: dolibarrThirdParty.name,
              name_alias: dolibarrThirdParty.name_alias || '',
              address: dolibarrThirdParty.address || '',
              zip: dolibarrThirdParty.zip || '',
              town: dolibarrThirdParty.town || '',
              state: dolibarrThirdParty.state || '',
              country: dolibarrThirdParty.country || '',
              phone: dolibarrThirdParty.phone || '',
              email: dolibarrThirdParty.email || '',
              website: dolibarrThirdParty.website || '',
              client: dolibarrThirdParty.client || false,
              supplier: dolibarrThirdParty.supplier || false,
              prospect: dolibarrThirdParty.prospect || false,
              status: dolibarrThirdParty.status || 'active',
              created_at: new Date(),
              updated_at: new Date(),
              last_contact: dolibarrThirdParty.last_contact ? new Date(dolibarrThirdParty.last_contact) : undefined,
              notes: dolibarrThirdParty.notes || ''
            };

            const existingThirdParty = await this.databaseService.getThirdParty(dolibarrThirdParty.id);
            if (existingThirdParty) {
              await this.databaseService.updateThirdParty(dolibarrThirdParty.id, localThirdParty);
              results.push({ action: 'updated', thirdParty: localThirdParty });
            } else {
              await this.databaseService.addThirdParty(localThirdParty);
              results.push({ action: 'created', thirdParty: localThirdParty });
            }
          } catch (error: any) {
            console.error(`Error syncing third party ${dolibarrThirdParty.id}:`, error);
            results.push({ action: 'error', thirdParty: dolibarrThirdParty, error: error.message });
          }
        }

        return results;
      }),
      catchError(error => {
        console.error('Error syncing third parties:', error);
        return of({ error: error.message });
      })
    );
  }

  /**
   * Test connection to Dolibarr API
   */
  testConnection(): Observable<boolean> {
    return this.dolibarrApiService.testConnection();
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<any> {
    try {
      const pendingSyncs = await this.databaseService.getPendingSyncLogs();
      const lastSync = pendingSyncs.length > 0 ? 
        Math.max(...pendingSyncs.map(log => log.created_at.getTime())) : 
        null;

      return {
        hasPendingSyncs: pendingSyncs.length > 0,
        pendingCount: pendingSyncs.length,
        lastSync: lastSync ? new Date(lastSync) : null
      };
    } catch (error: any) {
      console.error('Error getting sync status:', error);
      return { error: error.message };
    }
  }
}
