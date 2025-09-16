import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="config-container">
      <div class="config-card">
        <div class="config-header">
          <h1>NewDoli Configuration</h1>
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
          </div>
        </form>

        <div class="config-footer">
          <p>This configuration can be modified later in the settings.</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {
  configForm: FormGroup;
  
  // Signals for component state
  private errorMessageSignal = signal('');
  private successMessageSignal = signal('');
  
  // Computed signals
  public readonly errorMessage = computed(() => this.errorMessageSignal());
  public readonly successMessage = computed(() => this.successMessageSignal());
  public readonly isLoading = computed(() => this.configService.isLoading());
  public readonly isConfigured = computed(() => this.configService.isConfigured());

  constructor(
    private formBuilder: FormBuilder,
    private configService: ConfigService,
    private router: Router
  ) {
    this.configForm = this.formBuilder.group({
      dolibarrUrl: ['', [
        Validators.required,
        Validators.pattern(/^https?:\/\/.+/)
      ]]
    });
    
    // Effect to handle configuration state changes
    effect(() => {
      if (this.isConfigured()) {
        console.log('Configuration is complete, redirecting to login...');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      }
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
        
        this.successMessageSignal.set('Configuration saved successfully! Redirecting to login...');
        
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
}
