import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DatabaseService } from './services/database.service';

@Component({
  selector: 'app-test-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <h2>Test de Redirection</h2>
      
      <div class="test-section">
        <h3>Test de Redirection vers Dashboard</h3>
        <button (click)="testRedirect()" class="btn btn-primary">
          Rediriger vers Dashboard
        </button>
      </div>

      <div class="test-section">
        <h3>Vérification du Token Dolibarr</h3>
        <button (click)="checkToken()" class="btn btn-secondary">
          Vérifier le Token
        </button>
        <div *ngIf="tokenInfo" class="token-info">
          <pre>{{ tokenInfo | json }}</pre>
        </div>
      </div>

      <div class="test-section">
        <h3>Test de Navigation</h3>
        <button (click)="navigateToLogin()" class="btn btn-info">Aller au Login</button>
        <button (click)="navigateToConfig()" class="btn btn-warning">Aller à Config</button>
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
    
    .test-section {
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
    .btn-info { background-color: #17a2b8; color: white; }
    .btn-warning { background-color: #ffc107; color: black; }
    
    .token-info {
      margin-top: 10px;
      background-color: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
    }
    
    pre {
      background-color: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
  `]
})
export class TestRedirectComponent {
  tokenInfo: any = null;

  constructor(
    private router: Router,
    private databaseService: DatabaseService
  ) {}

  testRedirect() {
    console.log('Test de redirection vers dashboard...');
    this.router.navigate(['/dashboard']).then(success => {
      console.log('Redirection réussie:', success);
    }).catch(error => {
      console.error('Erreur de redirection:', error);
    });
  }

  async checkToken() {
    try {
      const token = await this.databaseService.getConfigurationValue('dolibarr_token');
      this.tokenInfo = {
        token: token ? 'Token présent' : 'Aucun token',
        tokenLength: token ? token.length : 0,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      this.tokenInfo = {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToConfig() {
    this.router.navigate(['/config']);
  }
}
