import { NavItem } from '../models/nav-item.model';

export const NAVIGATION_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', route: '/app/dashboard', icon: 'dashboard' },
  { id: 'cards', label: 'Cards', route: '/app/cards', icon: 'credit-card' },
  { id: 'customer', label: 'Customer', route: '/app/customer', icon: 'user' },
  { id: 'transactions', label: 'Transactions', route: '/app/transactions', icon: 'receipt' },
  { id: 'payments', label: 'Payments', route: '/app/payments', icon: 'payment' },
  { id: 'statements', label: 'Statements', route: '/app/statements', icon: 'document' },
  { id: 'rewards', label: 'Rewards', route: '/app/rewards', icon: 'gift' },
  { id: 'emi', label: 'EMI', route: '/app/emi', icon: 'calendar' },
  { id: 'disputes', label: 'Disputes', route: '/app/disputes', icon: 'alert-circle' },
  { id: 'fraud', label: 'Fraud', route: '/app/fraud', icon: 'shield-alert' },
  { id: 'ai', label: 'AI Insights', route: '/app/ai', icon: 'cpu' },
  { id: 'reports', label: 'Reports', route: '/app/reports', icon: 'chart' },
  { id: 'admin', label: 'Administration', route: '/app/admin', icon: 'settings' }
];
