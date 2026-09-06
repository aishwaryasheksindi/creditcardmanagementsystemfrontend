import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'app',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'cards',
        loadChildren: () => import('./features/cards/cards.module').then(m => m.CardsModule)
      },
      {
        path: 'customer',
        loadChildren: () => import('./features/customer/customer.module').then(m => m.CustomerModule)
      },
      {
        path: 'transactions',
        loadChildren: () => import('./features/transactions/transactions.module').then(m => m.TransactionsModule)
      },
      {
        path: 'payments',
        loadChildren: () => import('./features/payments/payments.module').then(m => m.PaymentsModule)
      },
      {
        path: 'statements',
        loadChildren: () => import('./features/statements/statements.module').then(m => m.StatementsModule)
      },
      {
        path: 'rewards',
        loadChildren: () => import('./features/rewards/rewards.module').then(m => m.RewardsModule)
      },
      {
        path: 'emi',
        loadChildren: () => import('./features/emi/emi.module').then(m => m.EmiModule)
      },
      {
        path: 'disputes',
        loadChildren: () => import('./features/disputes/disputes.module').then(m => m.DisputesModule)
      },
      {
        path: 'fraud',
        loadChildren: () => import('./features/fraud/fraud.module').then(m => m.FraudModule)
      },
      {
        path: 'ai',
        loadChildren: () => import('./features/ai/ai.module').then(m => m.AiModule)
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsModule)
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
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
