import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { ProductCardData, ProductFilters } from '../../models';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="products-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <h1>Products & Services</h1>
          <div class="header-actions">
            <button 
              class="btn btn-primary" 
              (click)="refresh()"
              [disabled]="isLoading()"
            >
              <span *ngIf="isLoading()" class="spinner"></span>
              {{ isLoading() ? 'Refreshing...' : 'Refresh' }}
            </button>
            <a routerLink="/products/new" class="btn btn-outline">
              Add Product
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
              placeholder="Search products and services (full-text search)..."
              [(ngModel)]="searchQuerySignal"
              (ngModelChange)="onSearchChange($event)"
              [disabled]="isLoading()"
            >
            <div class="search-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="filters-container">
          <div class="filter-group">
            <label for="type-filter">Type:</label>
            <select 
              id="type-filter" 
              [ngModel]="filtersSignal().type" 
              (ngModelChange)="onTypeChange($event)"
              class="filter-select"
            >
              <option value="">All Types</option>
              <option value="product">Products</option>
              <option value="service">Services</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="status-filter">Status:</label>
            <select 
              id="status-filter" 
              [ngModel]="filtersSignal().status" 
              (ngModelChange)="onStatusChange($event)"
              class="filter-select"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Inactive">Inactive</option>
              <option value="Obsolete">Obsolete</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="category-filter">Category:</label>
            <select 
              id="category-filter" 
              [ngModel]="filtersSignal().category" 
              (ngModelChange)="onCategoryChange($event)"
              class="filter-select"
            >
              <option value="">All Categories</option>
              <option *ngFor="let category of categories()" [value]="category">
                {{ category }}
              </option>
            </select>
          </div>

          <button 
            class="btn btn-outline btn-sm" 
            (click)="clearFilters()"
            [disabled]="!hasActiveFilters()"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Results Summary -->
      <div class="results-summary">
        <div class="results-info">
          <span class="results-count">{{ searchResult().totalCount }} product(s) found</span>
          <span *ngIf="searchQuery()" class="search-query">
            for "{{ searchQuery() }}"
          </span>
        </div>
        <div class="sync-info" *ngIf="!isOnline()">
          <span class="offline-indicator">Offline Mode</span>
        </div>
      </div>

      <!-- Products Grid -->
      <div class="products-grid" *ngIf="productCardData().length > 0; else noResults">
        <div 
          *ngFor="let product of productCardData(); trackBy: trackByProductId" 
          class="product-card"
          [class.low-stock]="product.stock <= product.stockAlert && product.type === 'product'"
        >
          <div class="card-header">
            <div class="product-type-chip" [class.product]="product.type === 'product'" [class.service]="product.type === 'service'">
              {{ product.type === 'product' ? 'Product' : 'Service' }}
            </div>
            <div class="product-status" [class]="'status-' + product.status">
              {{ product.statusLabel }}
            </div>
          </div>

          <div class="card-content">
            <div class="product-image" *ngIf="product.imageUrl">
              <img [src]="product.imageUrl" [alt]="product.label" loading="lazy">
            </div>
            <div class="no-image" *ngIf="!product.imageUrl">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21,15 16,10 5,21"></polyline>
              </svg>
            </div>

            <div class="product-info">
              <h3 class="product-title">{{ product.label }}</h3>
              <p class="product-ref">Ref: {{ product.ref }}</p>
              <p class="product-description" *ngIf="product.description">
                {{ product.description }}
              </p>
              <div class="product-category">{{ product.category }}</div>
            </div>

            <div class="product-pricing" *ngIf="product.type === 'product'">
              <div class="price-row">
                <span class="price-label">Price HT:</span>
                <span class="price-value">{{ product.price | currency:'EUR':'symbol':'1.2-2' }}</span>
              </div>
              <div class="price-row">
                <span class="price-label">Price TTC:</span>
                <span class="price-value price-ttc">{{ product.priceTTC | currency:'EUR':'symbol':'1.2-2' }}</span>
              </div>
            </div>

            <div class="product-stock" *ngIf="product.type === 'product'">
              <div class="stock-info">
                <span class="stock-label">Stock:</span>
                <span class="stock-value" [class.low-stock]="product.stock <= product.stockAlert">
                  {{ product.stock }}
                </span>
                <span *ngIf="product.stock <= product.stockAlert" class="stock-alert">
                  ⚠️ Alert: {{ product.stockAlert }}
                </span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <div class="last-modified">
              Modified: {{ product.lastModified | date:'short' }}
            </div>
            <div class="card-actions">
              <a [routerLink]="['/products', product.id, 'edit']" class="btn btn-sm btn-outline">
                Edit
              </a>
              <button class="btn btn-sm btn-danger" (click)="deleteProduct(product.id)">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <ng-template #noResults>
        <div class="no-results">
          <div class="no-results-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21,15 16,10 5,21"></polyline>
            </svg>
          </div>
          <h3>No products found</h3>
          <p *ngIf="searchQuery() || hasActiveFilters()">
            Try adjusting your search criteria or filters.
          </p>
          <p *ngIf="!searchQuery() && !hasActiveFilters()">
            No products are available. Add some products to get started.
          </p>
          <button class="btn btn-primary" (click)="clearFilters()" *ngIf="hasActiveFilters()">
            Clear Filters
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  private productsService = inject(ProductsService);
  private connectivityService = inject(ConnectivityService);

  // Signals from service
  public isLoading = this.productsService.isLoading;
  public searchResult = this.productsService.searchResult;
  public productCardData = this.productsService.productCardData;
  public searchQuery = this.productsService.searchQuery;

  // Local signals
  public searchQuerySignal = signal('');
  public filtersSignal = signal<ProductFilters>({
    searchQuery: '',
    type: null,
    status: null,
    category: null
  });

  // Computed signals
  public isOnline = this.connectivityService.isOnline;
  public categories = computed(() => {
    const products = this.productsService.products();
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    return uniqueCategories.sort();
  });

  public hasActiveFilters = computed(() => {
    const filters = this.filtersSignal();
    return !!(filters.type || filters.status || filters.category || filters.searchQuery);
  });

  ngOnInit(): void {
    // Initialize search query from service
    this.searchQuerySignal.set(this.productsService.searchQuery());
    this.filtersSignal.set(this.productsService.filters());
  }

  onSearchChange(query: string): void {
    this.searchQuerySignal.set(query);
    this.productsService.searchProducts(query);
  }

  onTypeChange(type: string): void {
    const productType = type === 'product' || type === 'service' ? type : null;
    this.filtersSignal.update(filters => ({ ...filters, type: productType }));
    this.productsService.updateFilters(this.filtersSignal());
  }

  onStatusChange(status: string): void {
    this.filtersSignal.update(filters => ({ ...filters, status: status || null }));
    this.productsService.updateFilters(this.filtersSignal());
  }

  onCategoryChange(category: string): void {
    this.filtersSignal.update(filters => ({ ...filters, category: category || null }));
    this.productsService.updateFilters(this.filtersSignal());
  }

  clearFilters(): void {
    this.searchQuerySignal.set('');
    this.filtersSignal.set({
      searchQuery: '',
      type: null,
      status: null,
      category: null
    });
    this.productsService.clearFilters();
  }

  refresh(): void {
    this.productsService.refresh();
  }

  deleteProduct(id: number): void {
    if (confirm('Are you sure you want to delete this product?')) {
      // TODO: Implement delete functionality
      console.log('Delete product:', id);
    }
  }

  trackByProductId(index: number, product: ProductCardData): number {
    return product.id;
  }
}
