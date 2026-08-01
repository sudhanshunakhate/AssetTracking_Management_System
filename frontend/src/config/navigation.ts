import type { IconName } from '@/components/ui/Icon'

export type NavItem = {
  id: string
  label: string
  badge?: string
  path: string
  /** Matches sysm_menutree_mst.mtree_menu_code / rolepermission menu FK */
  menuCode: string
  /** CAIMS icon set entry rendered in the sidebar */
  icon: IconName
}
export type NavGroup = { id: string; label: string; items: NavItem[] }

export const navGroups: NavGroup[] = [
  {
    id: 'master',
    label: 'Master Setup',
    items: [
      { id: 'unit', label: 'Unit Master', badge: 'UOM', path: '/masters/units', menuCode: 'UOM', icon: 'unitMaster' },
      { id: 'item', label: 'Item Master', badge: 'AIM', path: '/masters/items', menuCode: 'AIM', icon: 'itemMaster' },
      { id: 'invcat', label: 'Inventory Category', badge: 'ICM', path: '/masters/inventory-categories', menuCode: 'ICM', icon: 'inventoryCategory' },
      { id: 'invsubcat', label: 'Inventory Sub-Category', badge: 'ISC', path: '/masters/inventory-sub-categories', menuCode: 'ISC', icon: 'inventorySubcategory' },
      { id: 'gentype', label: 'General Type', badge: 'GTY', path: '/masters/general-types', menuCode: 'GTY', icon: 'generalType' },
      { id: 'genmaster', label: 'General Master', badge: 'GNM', path: '/masters/general-masters', menuCode: 'GNM', icon: 'generalMaster' },
      { id: 'vendor', label: 'Vendor / Party', badge: 'VPM', path: '/masters/vendors', menuCode: 'VPM', icon: 'vendorParty' },
    ],
  },
  {
    id: 'org',
    label: 'Organization',
    items: [
      { id: 'org', label: 'Organization (Entity)', badge: 'ORG', path: '/masters/organizations', menuCode: 'ORG', icon: 'organizationEntity' },
      { id: 'ou', label: 'Operating Unit', badge: 'OU', path: '/masters/operating-units', menuCode: 'OU', icon: 'operatingUnit' },
      { id: 'store', label: 'Location', badge: 'STR', path: '/masters/stores', menuCode: 'STR', icon: 'location' },
    ],
  },
  {
    id: 'access',
    label: 'Access & People',
    items: [
      { id: 'role', label: 'Role & Menu Mapping', badge: 'ARM', path: '/masters/roles', menuCode: 'ARM', icon: 'accessRole' },
      { id: 'employee', label: 'Employee', badge: 'EMP', path: '/masters/employees', menuCode: 'EMP', icon: 'employee' },
      { id: 'user', label: 'User Access Mapping', badge: 'USR', path: '/masters/users', menuCode: 'USR', icon: 'userLogin' },
      { id: 'exception', label: 'User Access Exception', badge: 'UAE', path: '/masters/exceptions', menuCode: 'UAE', icon: 'accessException' },
    ],
  },
  {
    id: 'transactions',
    label: 'Transactions',
    items: [
      { id: 'openstock', label: 'Opening Stock', badge: 'OPN', path: '/transactions/opening-stock', menuCode: 'OPN', icon: 'openingStock' },
      { id: 'matreq', label: 'Store Requisitions', badge: 'SR', path: '/transactions/requisitions', menuCode: 'SR', icon: 'storeRequisitions' },
      { id: 'grn', label: 'Goods Receipt Note', badge: 'GRN', path: '/transactions/grn', menuCode: 'GRN', icon: 'grn' },
      { id: 'getpass', label: 'Gatepass', badge: 'GP', path: '/transactions/gatepass', menuCode: 'GP', icon: 'gatepass' },
      { id: 'issue', label: 'Store Issue', badge: 'ISS', path: '/transactions/issues', menuCode: 'ISS', icon: 'storeIssue' },
      { id: 'transfer', label: 'Material Transfer', badge: 'TRF', path: '/transactions/transfers', menuCode: 'TRF', icon: 'materialTransfer' },
      { id: 'return', label: 'Material Return', badge: 'RTN', path: '/transactions/returns', menuCode: 'RTN', icon: 'materialReturn' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: '/dashboard', menuCode: 'DASH', icon: 'dashboard' },
      { id: 'stock-register', label: 'Stock Register', path: '/reports/stock-register', menuCode: 'STKREG', icon: 'stockRegister' },
      { id: 'full-report', label: 'Full Report', path: '/reports/full-report', menuCode: 'FULLRPT', icon: 'fullReport' },
    ],
  },
]
