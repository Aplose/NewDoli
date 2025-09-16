import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService } from './services/database.service';

@Component({
  selector: 'app-debug-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="debug-container">
      <h2>Debug Configuration Database</h2>
      
      <div class="debug-section">
        <h3>Test Configuration Storage</h3>
        <button (click)="testSetConfig()" class="btn btn-primary">Test Set Configuration</button>
        <button (click)="testGetConfig()" class="btn btn-secondary">Test Get Configuration</button>
        <button (click)="listAllConfigs()" class="btn btn-info">List All Configurations</button>
      </div>

      <div *ngIf="result" class="result-section">
        <h3>Résultat :</h3>
        <pre>{{ result | json }}</pre>
      </div>

      <div *ngIf="error" class="error-section">
        <h3>Erreur :</h3>
        <p class="error-message">{{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .debug-container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    
    .debug-section, .result-section, .error-section {
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
export class DebugConfigComponent {
  result: any = null;
  error: string = '';

  constructor(private databaseService: DatabaseService) {}

  async testSetConfig() {
    try {
      this.error = '';
      this.result = null;

      // Test setting a configuration
      const key = await this.databaseService.setConfiguration(
        'test_key',
        'test_value',
        'string',
        'Test configuration'
      );

      this.result = {
        action: 'setConfiguration',
        key: 'test_key',
        value: 'test_value',
        returnedKey: key,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      this.error = error.message;
    }
  }

  async testGetConfig() {
    try {
      this.error = '';
      this.result = null;

      // Test getting a configuration
      const value = await this.databaseService.getConfigurationValue('test_key');
      const config = await this.databaseService.getConfiguration('test_key');

      this.result = {
        action: 'getConfiguration',
        key: 'test_key',
        value: value,
        fullConfig: config,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      this.error = error.message;
    }
  }

  async listAllConfigs() {
    try {
      this.error = '';
      this.result = null;

      // List all configurations
      const configs = await this.databaseService.getAllConfigurations();

      this.result = {
        action: 'getAllConfigurations',
        count: configs.length,
        configurations: configs,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      this.error = error.message;
    }
  }
}
