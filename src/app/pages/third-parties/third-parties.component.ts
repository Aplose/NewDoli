import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ThirdPartiesService } from '../../services/third-parties.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { ThirdPartySearchResult } from '../../models';

@Component({
  selector: 'app-third-parties',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="third-parties-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <h1>Third Parties</h1>
          <div class="header-actions">
            <div class="connectivity-status" [class.online]="isOnline()" [class.offline]="!isOnline()">
              <span class="status-indicator"></span>
              <span class="status-text">{{ isOnline() ? 'Online' : 'Offline' }}</span>
              <span *ngIf="lastSync()" class="last-sync">
                Last sync: {{ lastSync() | date:'short' }}
              </span>
            </div>
            <button 
              class="btn btn-primary" 
              (click)="refresh()"
              [disabled]="isLoading()"
            >
              <span *ngIf="isLoading()" class="spinner"></span>
              {{ isLoading() ? 'Refreshing...' : 'Refresh' }}
            </button>
            <a routerLink="/third-parties/new" class="btn btn-outline">
              Add Third Party
            </a>
          </div>
        </div>
      </header>

      <!-- Search and Filters -->
      <div class="search-filters-section">
        <div class="search-container">
          <div class="search-input-wrapper">
            <input
              type="text"
              class="search-input"
              placeholder="Search third parties (full-text search)..."
              [(ngModel)]="searchQuerySignal"
              (input)="onSearchChange()"
              [disabled]="isLoading()"
            />
            <button 
              class="search-clear"
              (click)="clearSearch()"
              *ngIf="searchQuerySignal()"
              [disabled]="isLoading()"
            >
              ✕
            </button>
          </div>
          <div class="search-info" *ngIf="searchQuerySignal()">
        <span class="search-results-count">
          {{ searchResults().totalCount }} result(s) for "{{ searchQuerySignal() }}"
        </span>
          </div>
        </div>

        <div class="filters-container">
          <div class="filter-group">
            <label class="filter-label">Type:</label>
            <select 
              class="filter-select"
              [(ngModel)]="clientFilter"
              (change)="onFilterChange()"
              [disabled]="isLoading()"
            >
              <option value="">All</option>
              <option value="true">Clients</option>
              <option value="false">Non-Clients</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Supplier:</label>
            <select 
              class="filter-select"
              [(ngModel)]="supplierFilter"
              (change)="onFilterChange()"
              [disabled]="isLoading()"
            >
              <option value="">All</option>
              <option value="true">Suppliers</option>
              <option value="false">Non-Suppliers</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Prospect:</label>
            <select 
              class="filter-select"
              [(ngModel)]="prospectFilter"
              (change)="onFilterChange()"
              [disabled]="isLoading()"
            >
              <option value="">All</option>
              <option value="true">Prospects</option>
              <option value="false">Non-Prospects</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Status:</label>
            <select 
              class="filter-select"
              [(ngModel)]="statusFilter"
              (change)="onFilterChange()"
              [disabled]="isLoading()"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <button 
            class="btn btn-outline btn-sm"
            (click)="clearFilters()"
            [disabled]="isLoading()"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div *ngIf="error()" class="error-message global-error">
        {{ error() }}
        <button class="btn btn-outline btn-sm" (click)="refresh()">Retry</button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading() && !filteredThirdParties().length" class="loading-state">
        <div class="spinner-large"></div>
        <p>Loading third parties...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading() && !filteredThirdParties().length && !searchQuery" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No Third Parties</h3>
        <p>No third parties found. Start by adding your first third party.</p>
        <a routerLink="/third-parties/new" class="btn btn-primary">Add Third Party</a>
      </div>

      <!-- No Results State -->
      <div *ngIf="!isLoading() && !filteredThirdParties().length && searchQuery()" class="no-results-state">
        <div class="no-results-icon">🔍</div>
        <h3>No Results Found</h3>
        <p>No third parties match your search criteria.</p>
        <button class="btn btn-outline" (click)="clearSearch()">Clear Search</button>
      </div>

      <!-- Third Parties List -->
      <div *ngIf="filteredThirdParties().length" class="third-parties-list">
        <div class="list-header">
          <div class="list-info">
            <span class="total-count">{{ filteredThirdParties().length }} third parties</span>
            <span *ngIf="!isOnline()" class="offline-indicator">
              📱 Showing offline data
            </span>
          </div>
        </div>

        <div class="third-parties-grid">
          <div 
            *ngFor="let thirdParty of filteredThirdParties()" 
            class="third-party-card"
            [routerLink]="['/third-parties', thirdParty.id, 'edit']"
          >
            <div class="card-header">
              <h3 class="third-party-name">{{ thirdParty.name }}</h3>
              <div class="third-party-badges">
                <span *ngIf="thirdParty.client" class="badge badge-client">Client</span>
                <span *ngIf="thirdParty.supplier" class="badge badge-supplier">Supplier</span>
                <span *ngIf="thirdParty.prospect" class="badge badge-prospect">Prospect</span>
                <span class="badge badge-status" [class.active]="thirdParty.status === 'active'">
                  {{ thirdParty.status | titlecase }}
                </span>
              </div>
            </div>

            <div class="card-content">
              <div class="contact-info" *ngIf="thirdParty.email || thirdParty.phone">
                <div *ngIf="thirdParty.email" class="contact-item">
                  <span class="contact-icon">📧</span>
                  <span class="contact-value">{{ thirdParty.email }}</span>
                </div>
                <div *ngIf="thirdParty.phone" class="contact-item">
                  <span class="contact-icon">📞</span>
                  <span class="contact-value">{{ thirdParty.phone }}</span>
                </div>
              </div>

              <div class="address-info" *ngIf="thirdParty.address || thirdParty.town">
                <div class="address-item">
                  <span class="address-icon">📍</span>
                  <span class="address-value">
                    {{ getAddressString(thirdParty) }}
                  </span>
                </div>
              </div>

              <div class="notes-info" *ngIf="thirdParty.note_public">
                <p class="notes-text">{{ thirdParty.note_public | slice:0:100 }}{{ thirdParty.note_public.length > 100 ? '...' : '' }}</p>
              </div>
            </div>

            <div class="card-footer">
              <div class="dates">
                <span class="created-date">
                  Created: {{ thirdParty.created_at | date:'short' }}
                </span>
                <span *ngIf="thirdParty.last_contact" class="last-contact">
                  Last contact: {{ thirdParty.last_contact | date:'short' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./third-parties.component.scss']
})
export class ThirdPartiesComponent implements OnInit {
  // Local state signals
  public searchQuerySignal = signal('');
  private clientFilterSignal = signal('');
  private supplierFilterSignal = signal('');
  private prospectFilterSignal = signal('');
  private statusFilterSignal = signal('');

  // Computed signals
  public readonly searchQuery = computed(() => this.searchQuerySignal());
  public readonly clientFilter = computed(() => this.clientFilterSignal());
  public readonly supplierFilter = computed(() => this.supplierFilterSignal());
  public readonly prospectFilter = computed(() => this.prospectFilterSignal());
  public readonly statusFilter = computed(() => this.statusFilterSignal());

  // Service signals
  public readonly filteredThirdParties = computed(() => this.thirdPartiesService.filteredThirdParties());
  public readonly isLoading = computed(() => this.thirdPartiesService.isLoading());
  public readonly isOnline = computed(() => this.connectivityService.isOnline());
  public readonly lastSync = computed(() => this.thirdPartiesService.lastSync());
  public readonly error = computed(() => this.thirdPartiesService.error());

  // Search results
  public readonly searchResults = computed(() => this.thirdPartiesService.getSearchResults());

  constructor(
    private thirdPartiesService: ThirdPartiesService,
    private connectivityService: ConnectivityService
  ) {
    // Note: Search is handled manually in onSearchChange() to avoid infinite loops
  }

  ngOnInit(): void {
    // Component initialization
  }

  onSearchChange(): void {
    const query = this.searchQuerySignal();
    this.thirdPartiesService.searchThirdParties(query);
  }

  clearSearch(): void {
    this.searchQuerySignal.set('');
  }

  onFilterChange(): void {
    this.thirdPartiesService.setFilters({
      client: this.clientFilter() ? this.clientFilter() === 'true' : null,
      supplier: this.supplierFilter() ? this.supplierFilter() === 'true' : null,
      prospect: this.prospectFilter() ? this.prospectFilter() === 'true' : null,
      status: this.statusFilter() || null
    });
  }

  clearFilters(): void {
    this.searchQuerySignal.set('');
    this.clientFilterSignal.set('');
    this.supplierFilterSignal.set('');
    this.prospectFilterSignal.set('');
    this.statusFilterSignal.set('');
    this.thirdPartiesService.clearFilters();
  }

  async refresh(): Promise<void> {
    try {
      await this.thirdPartiesService.refresh();
    } catch (error) {
      console.error('Error refreshing third parties:', error);
    }
  }

  getAddressString(thirdParty: any): string {
    return [thirdParty.address, thirdParty.zip, thirdParty.town]
      .filter(item => item)
      .join(', ');
  }
}