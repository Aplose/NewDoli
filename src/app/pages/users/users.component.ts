import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DatabaseService, User } from '../../services/database.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="users-container">
      <header class="page-header">
        <h1>Users Management</h1>
        <a routerLink="/users/new" class="btn btn-primary" *ngIf="canCreateUser()">
          Add New User
        </a>
      </header>

      <div class="users-content">
        <div class="users-grid" *ngIf="users.length > 0; else noUsers">
          <div class="user-card" *ngFor="let user of users">
            <div class="user-avatar">
              {{ user.firstname.charAt(0) }}{{ user.lastname.charAt(0) }}
            </div>
            <div class="user-info">
              <h3>{{ user.firstname }} {{ user.lastname }}</h3>
              <p class="user-login">{{ user.login }}</p>
              <p class="user-email">{{ user.email }}</p>
              <div class="user-badges">
                <span class="badge" [class.admin]="user.admin">Admin</span>
                <span class="badge" [class.active]="user.active">Active</span>
              </div>
            </div>
            <div class="user-actions" *ngIf="canEditUser()">
              <a [routerLink]="['/users', user.id, 'edit']" class="btn btn-sm btn-outline">
                Edit
              </a>
            </div>
          </div>
        </div>

        <ng-template #noUsers>
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h3>No Users Found</h3>
            <p>Get started by creating your first user.</p>
            <a routerLink="/users/new" class="btn btn-primary" *ngIf="canCreateUser()">
              Add New User
            </a>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: User[] = [];

  constructor(
    private databaseService: DatabaseService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.users = await this.databaseService.getUsers();
  }

  canCreateUser(): boolean {
    return this.authService.hasPermission('user_write');
  }

  canEditUser(): boolean {
    return this.authService.hasPermission('user_write');
  }
}
