import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'BANK_OFFICER', 'CUSTOMER_SERVICE_AGENT', 'FRAUD_ANALYST', 'CUSTOMER'] },
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'cards',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'BANK_OFFICER', 'CUSTOMER'] },
        loadChildren: () => import('./features/cards/cards.module').then(m => m.CardsModule)
      },
      {
        path: 'customer',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'BANK_OFFICER', 'CUSTOMER_SERVICE_AGENT'] },
        loadChildren: () => import('./features/customer/customer.module').then(m => m.CustomerModule)
      },
      {
        path: 'transactions',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'BANK_OFFICER', 'CUSTOMER'] },
        loadChildren: () => import('./features/transactions/transactions.module').then(m => m.TransactionsModule)
      },
      {
        path: 'payments',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'BANK_OFFICER', 'CUSTOMER'] },
        loadChildren: () => import('./features/payments/payments.module').then(m => m.PaymentsModule)
      },
      {
        path: 'statements',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'BANK_OFFICER', 'CUSTOMER'] },
        loadChildren: () => import('./features/statements/statements.module').then(m => m.StatementsModule)
      },
      {
        path: 'rewards',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'CUSTOMER'] },
        loadChildren: () => import('./features/rewards/rewards.module').then(m => m.RewardsModule)
      },
      {
        path: 'emi',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'BANK_OFFICER', 'CUSTOMER'] },
        loadChildren: () => import('./features/emi/emi.module').then(m => m.EmiModule)
      },
      {
        path: 'disputes',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'CUSTOMER_SERVICE_AGENT', 'CUSTOMER'] },
        loadChildren: () => import('./features/disputes/disputes.module').then(m => m.DisputesModule)
      },
      {
        path: 'fraud',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'FRAUD_ANALYST'] },
        loadChildren: () => import('./features/fraud/fraud.module').then(m => m.FraudModule)
      },
      {
        path: 'ai',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'FRAUD_ANALYST'] },
        loadChildren: () => import('./features/ai/ai.module').then(m => m.AiModule)
      },
      {
        path: 'reports',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'BANK_OFFICER'] },
        loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsModule)
      },
      {
        path: 'admin',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] },
        loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
      },
      {
        path: 'access-denied',
        loadChildren: () => import('./features/access-denied/access-denied.module').then(m => m.AccessDeniedModule)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/app/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/app/dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
