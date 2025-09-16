import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginCredentials } from '../../models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>NewDoli</h1>
          <p>Modern Dolibarr Interface</p>
        </div>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="login">Username</label>
            <input
              type="text"
              id="login"
              formControlName="login"
              class="form-control"
              [class.error]="loginForm.get('login')?.invalid && loginForm.get('login')?.touched"
              placeholder="Enter your username"
            />
            <div *ngIf="loginForm.get('login')?.invalid && loginForm.get('login')?.touched" class="error-message">
              Username is required
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              formControlName="password"
              class="form-control"
              [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              placeholder="Enter your password"
            />
            <div *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched" class="error-message">
              Password is required
            </div>
          </div>

          <div *ngIf="errorMessage()" class="error-message global-error">
            {{ errorMessage() }}
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="loginForm.invalid || isLoading()"
          >
            <span *ngIf="isLoading()" class="spinner"></span>
            {{ isLoading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="login-footer">
          <p>NewDoli - Modernizing Dolibarr for the future</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  
  // Signals for component state
  private errorMessageSignal = signal('');
  private returnUrlSignal = signal('');
  
  // Computed signals
  public readonly errorMessage = computed(() => this.errorMessageSignal());
  public readonly returnUrl = computed(() => this.returnUrlSignal());
  public readonly isLoading = computed(() => this.authService.isLoading());
  public readonly isAuthenticated = computed(() => this.authService.isAuthenticated());

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      login: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
    
    // Effect to handle authentication state changes
    effect(() => {
      if (this.isAuthenticated()) {
        console.log('User is authenticated, redirecting to:', this.returnUrl());
        this.router.navigate([this.returnUrl()]);
      }
    });
  }

  ngOnInit(): void {
    // Get return URL from route parameters or default to '/dashboard'
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.returnUrlSignal.set(returnUrl);
    
    // If user is already logged in, redirect to return URL
    if (this.authService.isAuthenticated()) {
      this.router.navigate([returnUrl]);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      this.errorMessageSignal.set('');

      const credentials: LoginCredentials = {
        login: this.loginForm.value.login,
        password: this.loginForm.value.password
      };

      try {
        const success = await this.authService.login(credentials);
        if (success) {
          console.log('Login successful, redirecting to:', this.returnUrl());
          this.router.navigate([this.returnUrl()]);
        }
      } catch (error: any) {
        console.error('Login error:', error);
        this.errorMessageSignal.set(error.message || 'Login failed. Please check your credentials and try again.');
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}
