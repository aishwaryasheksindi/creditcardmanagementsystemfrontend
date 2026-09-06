import { NavItem } from '../models/nav-item.model';

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    route: '/app/dashboard',
    icon: 'dashboard',
    roles: ['ADMIN', 'BANK_OFFICER', 'CUSTOMER_SERVICE_AGENT', 'FRAUD_ANALYST', 'CUSTOMER']
  },
  {
    id: 'cards',
    label: 'Cards',
    route: '/app/cards',
    icon: 'credit-card',
    roles: ['ADMIN', 'BANK_OFFICER', 'CUSTOMER']
  },
  {
    id: 'customer',
    label: 'Customer',
    route: '/app/customer',
    icon: 'user',
    roles: ['ADMIN', 'BANK_OFFICER', 'CUSTOMER_SERVICE_AGENT']
  },
  {
    id: 'transactions',
    label: 'Transactions',
    route: '/app/transactions',
    icon: 'receipt',
    roles: ['ADMIN', 'BANK_OFFICER', 'CUSTOMER']
  },
  {
    id: 'payments',
    label: 'Payments',
    route: '/app/payments',
    icon: 'payment',
    roles: ['ADMIN', 'BANK_OFFICER', 'CUSTOMER']
  },
  {
    id: 'statements',
    label: 'Statements',
    route: '/app/statements',
    icon: 'document',
    roles: ['ADMIN', 'BANK_OFFICER', 'CUSTOMER']
  },
  {
    id: 'rewards',
    label: 'Rewards',
    route: '/app/rewards',
    icon: 'gift',
    roles: ['ADMIN', 'CUSTOMER']
  },
  {
    id: 'emi',
    label: 'EMI',
    route: '/app/emi',
    icon: 'calendar',
    roles: ['ADMIN', 'BANK_OFFICER', 'CUSTOMER']
  },
  {
    id: 'disputes',
    label: 'Disputes',
    route: '/app/disputes',
    icon: 'alert-circle',
    roles: ['ADMIN', 'CUSTOMER_SERVICE_AGENT', 'CUSTOMER']
  },
  {
    id: 'fraud',
    label: 'Fraud',
    route: '/app/fraud',
    icon: 'shield-alert',
    roles: ['ADMIN', 'FRAUD_ANALYST']
  },
  {
    id: 'ai',
    label: 'AI Insights',
    route: '/app/ai',
    icon: 'cpu',
    roles: ['ADMIN', 'FRAUD_ANALYST']
  },
  {
    id: 'reports',
    label: 'Reports',
    route: '/app/reports',
    icon: 'chart',
    roles: ['ADMIN', 'BANK_OFFICER']
  },
  {
    id: 'admin',
    label: 'Administration',
    route: '/app/admin',
    icon: 'settings',
    roles: ['ADMIN']
  }
];
