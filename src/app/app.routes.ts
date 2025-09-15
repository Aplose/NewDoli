import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { AdminGuard } from './guards/admin.guard';
import { ConfigGuard } from './guards/config.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/config',
    pathMatch: 'full'
  },
  {
    path: 'config',
    loadComponent: () => import('./pages/config/config.component').then(m => m.ConfigComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [ConfigGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [ConfigGuard, AuthGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent),
    canActivate: [ConfigGuard, AuthGuard, PermissionGuard],
    data: { permissions: ['user_read'] }
  },
  {
    path: 'users/new',
    loadComponent: () => import('./pages/users/user-form/user-form.component').then(m => m.UserFormComponent),
    canActivate: [ConfigGuard, AuthGuard, PermissionGuard],
    data: { permissions: ['user_write'] }
  },
  {
    path: 'users/:id/edit',
    loadComponent: () => import('./pages/users/user-form/user-form.component').then(m => m.UserFormComponent),
    canActivate: [ConfigGuard, AuthGuard, PermissionGuard],
    data: { permissions: ['user_write'] }
  },
  {
    path: 'groups',
    loadComponent: () => import('./pages/groups/groups.component').then(m => m.GroupsComponent),
    canActivate: [ConfigGuard, AuthGuard, PermissionGuard],
    data: { permissions: ['group_read'] }
  },
  {
    path: 'groups/new',
    loadComponent: () => import('./pages/groups/group-form/group-form.component').then(m => m.GroupFormComponent),
    canActivate: [ConfigGuard, AuthGuard, PermissionGuard],
    data: { permissions: ['group_write'] }
  },
  {
    path: 'groups/:id/edit',
    loadComponent: () => import('./pages/groups/group-form/group-form.component').then(m => m.GroupFormComponent),
    canActivate: [ConfigGuard, AuthGuard, PermissionGuard],
    data: { permissions: ['group_write'] }
  },
  {
    path: 'third-parties',
    loadComponent: () => import('./pages/third-parties/third-parties.component').then(m => m.ThirdPartiesComponent),
    canActivate: [ConfigGuard, AuthGuard, PermissionGuard],
    data: { permissions: ['thirdparty_read'] }
  },
  {
    path: 'third-parties/new',
    loadComponent: () => import('./pages/third-parties/third-party-form/third-party-form.component').then(m => m.ThirdPartyFormComponent),
    canActivate: [ConfigGuard, AuthGuard, PermissionGuard],
    data: { permissions: ['thirdparty_write'] }
  },
  {
    path: 'third-parties/:id/edit',
    loadComponent: () => import('./pages/third-parties/third-party-form/third-party-form.component').then(m => m.ThirdPartyFormComponent),
    canActivate: [ConfigGuard, AuthGuard, PermissionGuard],
    data: { permissions: ['thirdparty_write'] }
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [ConfigGuard, AuthGuard]
  },
  {
    path: 'field-visibility',
    loadComponent: () => import('./pages/field-visibility/field-visibility.component').then(m => m.FieldVisibilityComponent),
    canActivate: [ConfigGuard, AuthGuard, AdminGuard]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./pages/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
