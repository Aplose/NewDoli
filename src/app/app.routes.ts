import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { AdminGuard } from './guards/admin.guard';
import { ConfigGuard } from './guards/config.guard';
import { LoginGuard } from './guards/login.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'config',
    loadComponent: () => import('./pages/config/config.component').then(m => m.ConfigComponent),
    canActivate: [ConfigGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [LoginGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent),
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['user_read'] }
  },
  {
    path: 'users/new',
    loadComponent: () => import('./pages/users/user-form/user-form.component').then(m => m.UserFormComponent),
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['user_write'] }
  },
  {
    path: 'users/:id/edit',
    loadComponent: () => import('./pages/users/user-form/user-form.component').then(m => m.UserFormComponent),
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['user_write'] }
  },
  {
    path: 'groups',
    loadComponent: () => import('./pages/groups/groups.component').then(m => m.GroupsComponent),
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['group_read'] }
  },
  {
    path: 'groups/new',
    loadComponent: () => import('./pages/groups/group-form/group-form.component').then(m => m.GroupFormComponent),
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['group_write'] }
  },
  {
    path: 'groups/:id/edit',
    loadComponent: () => import('./pages/groups/group-form/group-form.component').then(m => m.GroupFormComponent),
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['group_write'] }
  },
  {
    path: 'third-parties',
    loadComponent: () => import('./pages/third-parties/third-parties.component').then(m => m.ThirdPartiesComponent),
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['thirdparty_read'] }
  },
  {
    path: 'third-parties/new',
    loadComponent: () => import('./pages/third-parties/third-party-form/third-party-form.component').then(m => m.ThirdPartyFormComponent),
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['thirdparty_write'] }
  },
  {
    path: 'third-parties/:id/edit',
    loadComponent: () => import('./pages/third-parties/third-party-form/third-party-form.component').then(m => m.ThirdPartyFormComponent),
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['thirdparty_write'] }
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent),
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['product_read'] }
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'field-visibility',
    loadComponent: () => import('./pages/field-visibility/field-visibility.component').then(m => m.FieldVisibilityComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'debug-config',
    loadComponent: () => import('./debug-config.component').then(m => m.DebugConfigComponent)
  },
  {
    path: 'debug-auth',
    loadComponent: () => import('./debug-auth.component').then(m => m.DebugAuthComponent)
  },
  {
    path: 'test-third-parties',
    loadComponent: () => import('./test-third-parties.component').then(m => m.TestThirdPartiesComponent)
  },
  {
    path: 'test-login-simple',
    loadComponent: () => import('./test-login-simple.component').then(m => m.TestLoginSimpleComponent)
  },
  {
    path: 'test-redirect',
    loadComponent: () => import('./test-redirect.component').then(m => m.TestRedirectComponent)
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
