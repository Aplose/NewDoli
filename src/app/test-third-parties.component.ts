import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThirdPartiesService } from './services/third-parties.service';
import { ConnectivityService } from './services/connectivity.service';

@Component({
  selector: 'app-test-third-parties',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <h2>Test Third Parties Component</h2>
      
      <div class="test-info">
        <p><strong>Connectivity:</strong> {{ isOnline() ? 'Online' : 'Offline' }}</p>
        <p><strong>Loading:</strong> {{ isLoading() ? 'Yes' : 'No' }}</p>
        <p><strong>Error:</strong> {{ error() || 'None' }}</p>
        <p><strong>Third Parties Count:</strong> {{ thirdParties().length }}</p>
        <p><strong>Filtered Count:</strong> {{ filteredThirdParties().length }}</p>
      </div>
      
      <div class="test-actions">
        <button (click)="refresh()" [disabled]="isLoading()">
          {{ isLoading() ? 'Loading...' : 'Refresh' }}
        </button>
        <button (click)="testSearch()">Test Search</button>
        <button (click)="clearFilters()">Clear Filters</button>
      </div>
      
      <div class="test-results" *ngIf="filteredThirdParties().length">
        <h3>Third Parties ({{ filteredThirdParties().length }})</h3>
        <div class="third-party-list">
          <div *ngFor="let tp of filteredThirdParties()" class="third-party-item">
            <strong>{{ tp.name }}</strong>
            <span *ngIf="tp.email"> - {{ tp.email }}</span>
            <div class="badges">
              <span *ngIf="tp.client" class="badge client">Client</span>
              <span *ngIf="tp.supplier" class="badge supplier">Supplier</span>
              <span *ngIf="tp.prospect" class="badge prospect">Prospect</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .test-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .test-actions {
      margin-bottom: 20px;
    }
    
    .test-actions button {
      margin-right: 10px;
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .test-actions button:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }
    
    .third-party-list {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .third-party-item {
      padding: 10px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      margin-bottom: 10px;
      background: white;
    }
    
    .badges {
      margin-top: 5px;
    }
    
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.8rem;
      margin-right: 5px;
    }
    
    .badge.client {
      background: #d1ecf1;
      color: #0c5460;
    }
    
    .badge.supplier {
      background: #d4edda;
      color: #155724;
    }
    
    .badge.prospect {
      background: #fff3cd;
      color: #856404;
    }
  `]
})
export class TestThirdPartiesComponent implements OnInit {
  // Service signals
  public readonly thirdParties = computed(() => this.thirdPartiesService.thirdParties());
  public readonly filteredThirdParties = computed(() => this.thirdPartiesService.filteredThirdParties());
  public readonly isLoading = computed(() => this.thirdPartiesService.isLoading());
  public readonly isOnline = computed(() => this.connectivityService.isOnline());
  public readonly error = computed(() => this.thirdPartiesService.error());

  constructor(
    private thirdPartiesService: ThirdPartiesService,
    private connectivityService: ConnectivityService
  ) {}

  ngOnInit(): void {
    console.log('TestThirdPartiesComponent initialized');
  }

  async refresh(): Promise<void> {
    try {
      console.log('Refreshing third parties...');
      await this.thirdPartiesService.refresh();
      console.log('Third parties refreshed successfully');
    } catch (error) {
      console.error('Error refreshing third parties:', error);
    }
  }

  testSearch(): void {
    console.log('Testing search...');
    this.thirdPartiesService.searchThirdParties('test');
  }

  clearFilters(): void {
    console.log('Clearing filters...');
    this.thirdPartiesService.clearFilters();
  }
}
