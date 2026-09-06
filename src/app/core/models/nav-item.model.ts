export interface NavItem {
  id: string;
  label: string;
  route: string;
  icon: string;
  badge?: string;
  roles?: string[];
}
