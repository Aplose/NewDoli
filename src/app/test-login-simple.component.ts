import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, LoginCredentials } from './services/auth.service';

@Component({
  selector: 'app-test-login-simple',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <h2>Test Login Simple</h2>
      
      <div class="test-section">
        <h3>Test de Connexion</h3>
        <button (click)="testLogin()" [disabled]="isLoading" class="btn btn-primary">
          {{ isLoading ? 'Connexion en cours...' : 'Tester la connexion' }}
        </button>
      </div>

      <div *ngIf="result" class="result-section">
        <h3>Résultat :</h3>
        <pre>{{ result | json }}</pre>
      </div>

      <div *ngIf="error" class="error-section">
        <h3>Erreur :</h3>
        <p class="error-message">{{ error }}</p>
      </div>

      <div class="debug-section">
        <h3>État d'Authentification :</h3>
        <p>Authentifié : {{ authService.isAuthenticated() }}</p>
        <p>Utilisateur : {{ authService.currentUser()?.login || 'Aucun' }}</p>
        <button (click)="checkAuth()" class="btn btn-secondary">Vérifier l'état</button>
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    
    .test-section, .result-section, .error-section, .debug-section {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    
    .btn {
      padding: 10px 20px;
      margin: 5px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .btn-primary { background-color: #007bff; color: white; }
    .btn-secondary { background-color: #6c757d; color: white; }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .error-message {
      color: #dc3545;
      font-weight: bold;
    }
    
    pre {
      background-color: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
  `]
})
export class TestLoginSimpleComponent {
  isLoading = false;
  result: any = null;
  error: string = '';

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  async testLogin() {
    this.isLoading = true;
    this.result = null;
    this.error = '';

    try {
      console.log('Début du test de connexion');
      
      const credentials: LoginCredentials = {
        login: 'toto',
        password: 'Toto01'
      };

      console.log('Tentative de connexion avec:', credentials);

      const success = await this.authService.login(credentials);
      
      console.log('Résultat de la connexion:', success);
      this.result = {
        success: success,
        message: success ? 'Connexion réussie !' : 'Connexion échouée',
        timestamp: new Date().toISOString(),
        isAuthenticated: this.authService.isAuthenticated(),
        currentUser: this.authService.currentUser()
      };
      
      if (success) {
        console.log('Redirection vers le dashboard...');
        this.router.navigate(['/dashboard']);
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      this.error = error.message || 'Erreur inconnue';
    } finally {
      this.isLoading = false;
    }
  }

  checkAuth() {
    this.result = {
      isAuthenticated: this.authService.isAuthenticated(),
      currentUser: this.authService.currentUser(),
      timestamp: new Date().toISOString()
    };
  }
}
