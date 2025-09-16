import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatabaseService } from './database.service';
import { ConnectivityService } from './connectivity.service';
import { Product, ProductSearchResult, ProductFilters, ProductCardData } from '../models';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  private http = inject(HttpClient);
  private databaseService = inject(DatabaseService);
  private connectivityService = inject(ConnectivityService);
  private configService = inject(ConfigService);
  private dolibarrUrl = this.configService.dolibarrUrl;
  private endpoint = this.dolibarrUrl() + 'products';

  // Signals
  public isLoading = signal(false);
  public products = signal<Product[]>([]);
  public searchQuery = signal('');
  public filters = signal<ProductFilters>({
    searchQuery: '',
    type: null,
    status: null,
    category: null
  });

  // Computed signals
  public filteredProducts = computed(() => {
    const allProducts = this.products();
    const currentFilters = this.filters();
    
    return allProducts.filter(product => {
      // Search query filter
      if (currentFilters.searchQuery) {
        const searchTerm = currentFilters.searchQuery.toLowerCase();
        const matchesSearch = 
          product.label.toLowerCase().includes(searchTerm) ||
          product.ref.toLowerCase().includes(searchTerm) ||
          (product.description && product.description.toLowerCase().includes(searchTerm)) ||
          product.category.toLowerCase().includes(searchTerm);
        
        if (!matchesSearch) return false;
      }

      // Type filter
      if (currentFilters.type && product.type !== currentFilters.type) {
        return false;
      }

      // Status filter
      if (currentFilters.status && product.statusLabel !== currentFilters.status) {
        return false;
      }

      // Category filter
      if (currentFilters.category && product.category !== currentFilters.category) {
        return false;
      }

      return true;
    });
  });

  public productCardData = computed(() => {
    return this.filteredProducts().map(product => this.mapToCardData(product));
  });

  public searchResult = computed((): ProductSearchResult => ({
    products: this.filteredProducts(),
    totalCount: this.filteredProducts().length,
    searchQuery: this.searchQuery(),
    isOnline: this.connectivityService.isOnline(),
    lastSync: this.connectivityService.lastCheck()
  }));

  constructor() {
    this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.isLoading.set(true);
    
    try {
      if (this.connectivityService.isOnline()) {
        await this.loadFromAPI();
      } else {
        await this.loadFromDatabase();
      }
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to database if API fails
      await this.loadFromDatabase();
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadFromAPI(): Promise<void> {
    try {
      // TODO: Replace with actual API endpoint
      const response = await this.http.get<Product[]>(this.endpoint).toPromise();
      
      if (response) {
        const products = response.map(item => this.mapFromAPI(item));
        this.products.set(products);
        
        // Save to database for offline use
        await this.saveProductsToDatabase(products);
      }
    } catch (error) {
      console.error('Error loading products from API:', error);
      throw error;
    }
  }

  private async loadFromDatabase(): Promise<void> {
    try {
      const products = await this.databaseService.getAllProducts();
      this.products.set(products);
    } catch (error) {
      console.error('Error loading products from database:', error);
      throw error;
    }
  }

  private async saveProductsToDatabase(products: Product[]): Promise<void> {
    try {
      // Clear existing products
      await this.databaseService.clearProducts();
      
      // Add new products
      for (const product of products) {
        await this.databaseService.addProduct(product);
      }
    } catch (error) {
      console.error('Error saving products to database:', error);
    }
  }

  async searchProducts(query: string): Promise<void> {
    this.searchQuery.set(query);
    this.filters.update(filters => ({ ...filters, searchQuery: query }));
    
    if (this.connectivityService.isOnline()) {
      try {
        await this.searchFromAPI(query);
      } catch (error) {
        console.error('Error searching products from API:', error);
        // Fallback to local search
        await this.searchFromDatabase(query);
      }
    } else {
      await this.searchFromDatabase(query);
    }
  }

  private async searchFromAPI(query: string): Promise<void> {
    try {
      // TODO: Replace with actual API endpoint
      const response = await this.http.get<any[]>(`/api/products/search?q=${encodeURIComponent(query)}`).toPromise();
      
      if (response) {
        const products = response.map(item => this.mapFromAPI(item));
        this.products.set(products);
      }
    } catch (error) {
      console.error('Error searching products from API:', error);
      throw error;
    }
  }

  private async searchFromDatabase(query: string): Promise<void> {
    try {
      const products = await this.databaseService.searchProducts(query);
      this.products.set(products);
    } catch (error) {
      console.error('Error searching products from database:', error);
      throw error;
    }
  }

  updateFilters(filters: Partial<ProductFilters>): void {
    this.filters.update(current => ({ ...current, ...filters }));
  }

  clearFilters(): void {
    this.filters.set({
      searchQuery: '',
      type: null,
      status: null,
      category: null
    });
    this.searchQuery.set('');
  }

  async refresh(): Promise<void> {
    await this.loadProducts();
  }

  private mapFromAPI(apiProduct: any): Product {
    return {
      id: apiProduct.id,
      ref: apiProduct.ref || '',
      label: apiProduct.label || '',
      description: apiProduct.description || '',
      type: apiProduct.type || 'product',
      price: apiProduct.price || 0,
      priceTTC: apiProduct.price_ttc || 0,
      status: apiProduct.status || 1,
      statusLabel: this.getStatusLabel(apiProduct.status || 1),
      category: apiProduct.category || 'Uncategorized',
      stock: apiProduct.stock || 0,
      stockAlert: apiProduct.stock_alert || 0,
      imageUrl: apiProduct.image_url,
      created_at: new Date(apiProduct.date_creation || Date.now()),
      updated_at: new Date(apiProduct.date_modification || Date.now()),
      lastModified: new Date(apiProduct.date_modification || Date.now())
    };
  }

  private mapToCardData(product: Product): ProductCardData {
    return {
      id: product.id!,
      ref: product.ref,
      label: product.label,
      description: product.description || '',
      type: product.type,
      price: product.price,
      priceTTC: product.priceTTC,
      status: product.status,
      statusLabel: product.statusLabel,
      category: product.category,
      stock: product.stock,
      stockAlert: product.stockAlert,
      lastModified: product.lastModified,
      imageUrl: product.imageUrl
    };
  }

  private getStatusLabel(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'Draft',
      1: 'Active',
      [-1]: 'Inactive',
      [-2]: 'Obsolete'
    };
    return statusMap[status] || 'Unknown';
  }

  async clearProducts(): Promise<void> {
    await this.databaseService.clearProducts();
  }
}
