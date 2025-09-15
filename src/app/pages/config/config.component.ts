import { Component, OnInit } from '@angular/core';
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

          <div *ngIf="errorMessage" class="error-message global-error">
            {{ errorMessage }}
          </div>

          <div *ngIf="successMessage" class="success-message">
            {{ successMessage }}
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="configForm.invalid || isLoading"
            >
              <span *ngIf="isLoading" class="spinner"></span>
              {{ isLoading ? 'Saving...' : 'Save Configuration' }}
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
  isLoading = false;
  errorMessage = '';
  successMessage = '';

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
    }
  }

  async onSubmit(): Promise<void> {
    if (this.configForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      try {
        const url = this.configForm.value.dolibarrUrl;
        await this.configService.setDolibarrUrl(url);
        
        this.successMessage = 'Configuration saved successfully! Redirecting to login...';
        
        // Wait a moment to show success message, then redirect
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
        
      } catch (error: any) {
        this.errorMessage = error.message || 'Failed to save configuration. Please try again.';
      } finally {
        this.isLoading = false;
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.configForm.controls).forEach(key => {
        this.configForm.get(key)?.markAsTouched();
      });
    }
  }
}
