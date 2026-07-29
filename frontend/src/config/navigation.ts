export type NavItem = { id: string; label: string; badge?: string; path: string }
export type NavGroup = { id: string; label: string; items: NavItem[] }

export const navGroups: NavGroup[] = [
  {
    id: 'master',
    label: 'Master Setup',
    items: [
      { id: 'unit', label: 'Unit Master', badge: 'UOM', path: '/masters/units' },
      { id: 'item', label: 'Item Master', badge: 'AIM', path: '/masters/items' },
      { id: 'invcat', label: 'Inventory Category', badge: 'ICM', path: '/masters/inventory-categories' },
      { id: 'invsubcat', label: 'Inventory Sub-Category', badge: 'ISC', path: '/masters/inventory-sub-categories' },
      { id: 'gentype', label: 'General Type', badge: 'GTY', path: '/masters/general-types' },
      { id: 'genmaster', label: 'General Master', badge: 'GNM', path: '/masters/general-masters' },
      { id: 'vendor', label: 'Vendor / Party', badge: 'VPM', path: '/masters/vendors' },
    ],
  },
  {
    id: 'org',
    label: 'Organization',
    items: [
      { id: 'org', label: 'Organization (Entity)', badge: 'ORG', path: '/masters/organizations' },
      { id: 'ou', label: 'Operating Unit', badge: 'OU', path: '/masters/operating-units' },
      { id: 'store', label: 'Location', badge: 'STR', path: '/masters/stores' },
    ],
  },
  {
    id: 'access',
    label: 'Access & People',
    items: [
      { id: 'role', label: 'Access Role', badge: 'ARM', path: '/masters/roles' },
      { id: 'employee', label: 'Employee', badge: 'EMP', path: '/masters/employees' },
      { id: 'user', label: 'User Login', badge: 'USR', path: '/masters/users' },
      { id: 'menuaccess', label: 'Menu Access', badge: 'MNU', path: '/masters/menu-access' },
      { id: 'exception', label: 'Access Exception', badge: 'UAE', path: '/masters/exceptions' },
    ],
  },
  {
    id: 'transactions',
    label: 'Transactions',
    items: [
      { id: 'openstock', label: 'Opening Stock', badge: 'OPN', path: '/transactions/opening-stock' },
      { id: 'matreq', label: 'Store Requisitions', badge: 'SR', path: '/transactions/requisitions' },
      { id: 'grn', label: 'Goods Receipt Note', badge: 'GRN', path: '/transactions/grn' },
      { id: 'getpass', label: 'Gatepass', badge: 'GP', path: '/transactions/gatepass' },
      { id: 'issue', label: 'Store Issue', badge: 'ISS', path: '/transactions/issues' },
      { id: 'transfer', label: 'Material Transfer', badge: 'TRF', path: '/transactions/transfers' },
      { id: 'return', label: 'Material Return', badge: 'RTN', path: '/transactions/returns' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
      { id: 'stock-register', label: 'Stock Register', path: '/reports/stock-register' },
      { id: 'full-report', label: 'Full Report', path: '/reports/full-report' },
    ],
  },
]
