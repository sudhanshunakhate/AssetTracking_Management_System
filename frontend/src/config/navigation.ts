export type NavItem = {
  id: string
  label: string
  badge?: string
  path: string
  /** Matches sysm_menutree_mst.mtree_menu_code / rolepermission menu FK */
  menuCode: string
}
export type NavGroup = { id: string; label: string; items: NavItem[] }

export const navGroups: NavGroup[] = [
  {
    id: 'master',
    label: 'Master Setup',
    items: [
      { id: 'unit', label: 'Unit Master', badge: 'UOM', path: '/masters/units', menuCode: 'UOM' },
      { id: 'item', label: 'Item Master', badge: 'AIM', path: '/masters/items', menuCode: 'AIM' },
      { id: 'invcat', label: 'Inventory Category', badge: 'ICM', path: '/masters/inventory-categories', menuCode: 'ICM' },
      { id: 'invsubcat', label: 'Inventory Sub-Category', badge: 'ISC', path: '/masters/inventory-sub-categories', menuCode: 'ISC' },
      { id: 'gentype', label: 'General Type', badge: 'GTY', path: '/masters/general-types', menuCode: 'GTY' },
      { id: 'genmaster', label: 'General Master', badge: 'GNM', path: '/masters/general-masters', menuCode: 'GNM' },
      { id: 'vendor', label: 'Vendor / Party', badge: 'VPM', path: '/masters/vendors', menuCode: 'VPM' },
    ],
  },
  {
    id: 'org',
    label: 'Organization',
    items: [
      { id: 'org', label: 'Organization (Entity)', badge: 'ORG', path: '/masters/organizations', menuCode: 'ORG' },
      { id: 'ou', label: 'Operating Unit', badge: 'OU', path: '/masters/operating-units', menuCode: 'OU' },
      { id: 'store', label: 'Location', badge: 'STR', path: '/masters/stores', menuCode: 'STR' },
    ],
  },
  {
    id: 'access',
    label: 'Access & People',
    items: [
      { id: 'role', label: 'Role & Menu Mapping', badge: 'ARM', path: '/masters/roles', menuCode: 'ARM' },
      { id: 'employee', label: 'Employee', badge: 'EMP', path: '/masters/employees', menuCode: 'EMP' },
      { id: 'user', label: 'User Access Mapping', badge: 'USR', path: '/masters/users', menuCode: 'USR' },
      { id: 'exception', label: 'User Access Exception', badge: 'UAE', path: '/masters/exceptions', menuCode: 'UAE' },
    ],
  },
  {
    id: 'transactions',
    label: 'Transactions',
    items: [
      { id: 'openstock', label: 'Opening Stock', badge: 'OPN', path: '/transactions/opening-stock', menuCode: 'OPN' },
      { id: 'matreq', label: 'Store Requisitions', badge: 'SR', path: '/transactions/requisitions', menuCode: 'SR' },
      { id: 'grn', label: 'Goods Receipt Note', badge: 'GRN', path: '/transactions/grn', menuCode: 'GRN' },
      { id: 'getpass', label: 'Gatepass', badge: 'GP', path: '/transactions/gatepass', menuCode: 'GP' },
      { id: 'issue', label: 'Store Issue', badge: 'ISS', path: '/transactions/issues', menuCode: 'ISS' },
      { id: 'transfer', label: 'Material Transfer', badge: 'TRF', path: '/transactions/transfers', menuCode: 'TRF' },
      { id: 'return', label: 'Material Return', badge: 'RTN', path: '/transactions/returns', menuCode: 'RTN' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: '/dashboard', menuCode: 'DASH' },
      { id: 'stock-register', label: 'Stock Register', path: '/reports/stock-register', menuCode: 'STKREG' },
      { id: 'full-report', label: 'Full Report', path: '/reports/full-report', menuCode: 'FULLRPT' },
    ],
  },
]
