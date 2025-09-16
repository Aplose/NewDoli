import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { PageTitleService } from '../../services/page-title.service';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="top-bar">
      <div class="top-bar-content">
        <!-- Informations de login -->
        <div class="user-info">
          <div class="user-avatar">
            <span class="avatar-text">{{ getUserInitials() }}</span>
          </div>
          <div class="user-details">
            <div class="user-name">{{ getUserDisplayName() }}</div>
            <div class="user-role">{{ getUserRole() }}</div>
          </div>
        </div>

        <!-- Titre de la page -->
        <div class="page-title">
          <h1>{{ pageTitle() }}</h1>
        </div>

        <!-- Actions à droite -->
        <div class="top-bar-actions">
          <!-- Statut de connectivité -->
          <div class="connectivity-status" [class.online]="isOnline()" [class.offline]="!isOnline()">
            <span class="status-indicator"></span>
            <span class="status-text">{{ isOnline() ? 'Online' : 'Offline' }}</span>
            <span *ngIf="lastSync()" class="last-sync">
              Last sync: {{ lastSync() | date:'short' }}
            </span>
          </div>

          <!-- Bouton Logout -->
          <button (click)="logout()" class="btn btn-outline logout-btn">
            Logout
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent {
  private connectivityService = inject(ConnectivityService);
  private pageTitleService = inject(PageTitleService);
  private authService = inject(AuthService);

  // Services
  public isOnline = this.connectivityService.isOnline;
  public lastSync = this.connectivityService.lastCheck;
  public pageTitle = this.pageTitleService.currentPageTitle;

  // Computed signals
  public getCurrentUser = computed(() => this.authService.currentUser());
  public getUserDisplayName = computed(() => {
    const user = this.getCurrentUser();
    if (!user) return 'Guest';
    return `${user.firstname} ${user.lastname}`.trim();
  });
  public getUserRole = computed(() => {
    const user = this.getCurrentUser();
    if (!user) return 'User';
    return user.admin ? 'Admin' : 'User';
  });
  public getUserInitials = computed(() => {
    const user = this.getCurrentUser();
    if (!user) return '?';
    const firstInitial = user.firstname?.charAt(0) || '';
    const lastInitial = user.lastname?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  });

  // Méthode logout
  logout(): void {
    this.authService.logout();
  }
}
