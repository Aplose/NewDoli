import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-debug-auth',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="debug-container">
      <h2>Debug Authentication State</h2>
      
      <div class="debug-section">
        <h3>Auth State</h3>
        <pre>{{ authState | json }}</pre>
      </div>
      
      <div class="debug-section">
        <h3>User Info</h3>
        <pre>{{ userInfo | json }}</pre>
      </div>
      
      <div class="debug-section">
        <h3>Module Access Tests</h3>
        <ul>
          <li>user: {{ canAccessModule('user') }}</li>
          <li>thirdparty: {{ canAccessModule('thirdparty') }}</li>
          <li>group: {{ canAccessModule('group') }}</li>
          <li>admin: {{ isAdmin() }}</li>
        </ul>
      </div>
      
      <div class="debug-section">
        <h3>Actions</h3>
        <button (click)="refreshState()">Refresh State</button>
        <button (click)="clearStorage()">Clear Storage</button>
      </div>
    </div>
  `,
  styles: [`
    .debug-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .debug-section {
      margin-bottom: 20px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    
    pre {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 3px;
      overflow-x: auto;
    }
    
    button {
      margin-right: 10px;
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:hover {
      background: #0056b3;
    }
  `]
})
export class DebugAuthComponent implements OnInit {
  authState: any;
  userInfo: any;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.refreshState();
  }

  refreshState(): void {
    this.authState = this.authService.getAuthState();
    this.userInfo = {
      user: this.authService.currentUser(),
      permissions: this.authService.userPermissions(),
      rights: this.authService.userRights(),
      isAdmin: this.authService.isAdmin()
    };
  }

  canAccessModule(module: string): boolean {
    return this.authService.canAccessModule(module);
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  clearStorage(): void {
    localStorage.clear();
    this.refreshState();
  }
}
