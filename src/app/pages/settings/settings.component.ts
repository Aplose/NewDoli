import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ConfigService } from '../../services/config.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="settings-container">
      <header class="page-header">
        <h1>Settings</h1>
        <p>Manage your application configuration</p>
      </header>

      <div class="settings-content">
        <div class="settings-card">
          <div class="card-header">
            <h3>Dolibarr Configuration</h3>
            <p>Configure your Dolibarr server connection</p>
          </div>
          
          <form [formGroup]="configForm" (ngSubmit)="onSubmit()" class="config-form">
            <div class="form-group">
              <label for="dolibarrUrl">Dolibarr Server URL</label>
              <input
                type="url"
                id="dolibarrUrl"
                formControlName="dolibarrUrl"
                class="form-control"
                [class.error]="configForm.get('dolibarrUrl')?.invalid && configForm.get('dolibarrUrl')?.touched"
                placeholder="https://your-dolibarr-server.com/"
              />
              <div *ngIf="configForm.get('dolibarrUrl')?.invalid && configForm.get('dolibarrUrl')?.touched" class="error-message">
                <span *ngIf="configForm.get('dolibarrUrl')?.errors?.['required']">URL is required</span>
                <span *ngIf="configForm.get('dolibarrUrl')?.errors?.['pattern']">Please enter a valid URL</span>
              </div>
              <div class="form-help">
                Enter the complete URL of your Dolibarr server (e.g., https://your-dolibarr-server.com/)
              </div>
            </div>

            <div *ngIf="errorMessage()" class="error-message global-error">
              {{ errorMessage() }}
            </div>

            <div *ngIf="successMessage()" class="success-message">
              {{ successMessage() }}
            </div>

            <div class="form-actions">
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="configForm.invalid || isLoading()"
              >
                <span *ngIf="isLoading()" class="spinner"></span>
                {{ isLoading() ? 'Saving...' : 'Save Configuration' }}
              </button>
              <button
                type="button"
                class="btn btn-outline"
                (click)="resetForm()"
                [disabled]="isLoading()"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        <div class="settings-card">
          <div class="card-header">
            <h3>User Information</h3>
            <p>Your current user details</p>
          </div>
          <div class="user-info">
            <div class="info-item">
              <label>Name:</label>
              <span>{{ currentUser()?.firstname }} {{ currentUser()?.lastname }}</span>
            </div>
            <div class="info-item">
              <label>Email:</label>
              <span>{{ currentUser()?.email }}</span>
            </div>
            <div class="info-item">
              <label>Role:</label>
              <span class="badge" [class.admin]="isAdmin()">
                {{ isAdmin() ? 'Administrator' : 'User' }}
              </span>
            </div>
            <div class="info-item">
              <label>Status:</label>
              <span class="badge" [class.active]="currentUser()?.active">
                {{ currentUser()?.active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>

        <div class="settings-card">
          <div class="card-header">
            <h3>Actions</h3>
            <p>Manage your session and data</p>
          </div>
          <div class="action-buttons">
            <button class="btn btn-outline" (click)="logout()">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  configForm: FormGroup;
  
  // Signals for component state
  private errorMessageSignal = signal('');
  private successMessageSignal = signal('');
  
  // Computed signals
  public readonly errorMessage = computed(() => this.errorMessageSignal());
  public readonly successMessage = computed(() => this.successMessageSignal());
  public readonly isLoading = computed(() => this.configService.isLoading());
  public readonly currentUser = computed(() => this.authService.currentUser());
  public readonly isAdmin = computed(() => this.authService.isAdmin());

  constructor(
    private formBuilder: FormBuilder,
    private configService: ConfigService,
    private authService: AuthService
  ) {
    this.configForm = this.formBuilder.group({
      dolibarrUrl: ['', [
        Validators.required,
        Validators.pattern(/^https?:\/\/.+/)
      ]]
    });
  }

  ngOnInit(): void {
    this.loadCurrentConfig();
  }

  private async loadCurrentConfig(): Promise<void> {
    try {
      const currentUrl = await this.configService.getDolibarrUrl();
      if (currentUrl) {
        this.configForm.patchValue({
          dolibarrUrl: currentUrl
        });
      }
    } catch (error) {
      console.error('Error loading current configuration:', error);
      this.errorMessageSignal.set('Failed to load current configuration');
    }
  }

  async onSubmit(): Promise<void> {
    if (this.configForm.valid) {
      this.errorMessageSignal.set('');
      this.successMessageSignal.set('');

      try {
        const url = this.configForm.value.dolibarrUrl;
        await this.configService.setDolibarrUrl(url);
        
        this.successMessageSignal.set('Configuration updated successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessageSignal.set('');
        }, 3000);
        
      } catch (error: any) {
        this.errorMessageSignal.set(error.message || 'Failed to save configuration. Please try again.');
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.configForm.controls).forEach(key => {
        this.configForm.get(key)?.markAsTouched();
      });
    }
  }

  resetForm(): void {
    this.loadCurrentConfig();
    this.errorMessageSignal.set('');
    this.successMessageSignal.set('');
  }

  logout(): void {
    this.authService.logout();
  }
}