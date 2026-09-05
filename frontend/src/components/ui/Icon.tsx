import type { ReactNode, SVGProps } from 'react'

/**
 * CAIMS standardized icon set (32 outline icons).
 * Style spec: 20x20 viewBox, 1.7px stroke, round caps/joins, no fill.
 * Colour comes from `currentColor` so icons inherit active/hover states.
 */
export type IconName =
  | 'unitMaster'
  | 'itemMaster'
  | 'inventoryCategory'
  | 'inventorySubcategory'
  | 'generalType'
  | 'generalMaster'
  | 'vendorParty'
  | 'organizationEntity'
  | 'operatingUnit'
  | 'location'
  | 'accessRole'
  | 'employee'
  | 'userLogin'
  | 'menuAccess'
  | 'accessException'
  | 'openingStock'
  | 'storeRequisitions'
  | 'grn'
  | 'gatepass'
  | 'storeIssue'
  | 'materialTransfer'
  | 'materialReturn'
  | 'dashboard'
  | 'stockRegister'
  | 'fullReport'
  | 'stockValueByCategory'
  | 'lowStockAlert'
  | 'recentActivity'
  | 'storeWiseStock'
  | 'closingStockQty'
  | 'stockValue'
  | 'activeEmployees'

const PATHS: Record<IconName, ReactNode> = {
  unitMaster: (
    <>
      <path d="M3 13.5 13.5 3l3.5 3.5L6.5 17 3 13.5Z" />
      <path d="M9 8l1.4 1.4M11.5 5.5 13 7M6.5 10.5 8 12" />
    </>
  ),
  itemMaster: (
    <>
      <path d="M10 2 3 5.5v9L10 18l7-3.5v-9L10 2Z" />
      <path d="M3 5.5 10 9l7-3.5M10 9v9" />
    </>
  ),
  inventoryCategory: (
    <path d="M2.5 5.5a1 1 0 0 1 1-1H8l1.5 2H16a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5.5Z" />
  ),
  inventorySubcategory: (
    <>
      <path d="M10 2 2.5 6 10 10l7.5-4L10 2Z" />
      <path d="M2.5 10 10 14l7.5-4M2.5 14 10 18l7.5-4" />
    </>
  ),
  generalType: (
    <>
      <path d="M10.5 2.5H16a1 1 0 0 1 1 1v5.5a1 1 0 0 1-.3.7l-7 7a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.4l7-7a1 1 0 0 1 .7-.3Z" />
      <circle cx="13" cy="6.5" r="1.1" />
    </>
  ),
  generalMaster: (
    <>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1" />
    </>
  ),
  vendorParty: (
    <>
      <rect x="3" y="7" width="6" height="11" rx="0.5" />
      <rect x="11" y="2" width="6" height="16" rx="0.5" />
      <path d="M5.5 10h1M5.5 13h1M13.5 5h1M13.5 8h1M13.5 11h1" />
    </>
  ),
  organizationEntity: (
    <>
      <path d="M2.5 7 10 2.5 17.5 7" />
      <path d="M3.5 7v9M7 7v9M13 7v9M16.5 7v9" />
      <path d="M2.5 16.5h15" />
    </>
  ),
  operatingUnit: (
    <>
      <rect x="4" y="2.5" width="12" height="15" rx="0.5" />
      <path d="M7 6h1.4M11.6 6H13M7 9.5h1.4M11.6 9.5H13M7 13h1.4M11.6 13H13" />
    </>
  ),
  location: (
    <>
      <path d="M10 18s6-6.1 6-10.5A6 6 0 0 0 4 7.5C4 11.9 10 18 10 18Z" />
      <circle cx="10" cy="7.5" r="2" />
    </>
  ),
  accessRole: <path d="M10 2.3 16.5 5v5c0 4.5-3 7.4-6.5 8.7C6.5 17.4 3.5 14.5 3.5 10V5L10 2.3Z" />,
  employee: (
    <>
      <circle cx="10" cy="6.5" r="3.2" />
      <path d="M3.5 17c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5" />
    </>
  ),
  userLogin: (
    <>
      <circle cx="6" cy="14" r="3.2" />
      <path d="M8.3 11.7 15 5l1.5 1.5M13 7.5 14.7 9.2" />
    </>
  ),
  menuAccess: (
    <>
      <rect x="2.5" y="3" width="4" height="4" rx="0.7" />
      <rect x="2.5" y="8.5" width="4" height="4" rx="0.7" />
      <rect x="2.5" y="14" width="4" height="4" rx="0.7" />
      <path d="M9 5h8.5M9 10.5h8.5M9 16h8.5" />
    </>
  ),
  accessException: (
    <path d="M13.7 3.3a3.7 3.7 0 0 0-5 3.9L3 13l2 2 5.8-5.7a3.7 3.7 0 0 0 3.9-5 3.7 3.7 0 0 0-1-.9Z" />
  ),
  openingStock: (
    <>
      <path d="M9 2 2.5 5.5v9L9 18l6.5-3.5v-4" />
      <path d="M2.5 5.5 9 9l6.5-3.5M9 9v9" />
      <path d="M15.5 3v5M13 5.5h5" />
    </>
  ),
  storeRequisitions: (
    <>
      <rect x="4" y="3.5" width="12" height="14" rx="1.2" />
      <rect x="7" y="2" width="6" height="3" rx="0.8" />
      <path d="M6.5 9h7M6.5 12h7M6.5 15h4.5" />
    </>
  ),
  grn: (
    <>
      <path d="M2.5 11 5 4h10l2.5 7" />
      <path d="M2.5 11v4a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-4h-4.2a2.8 2.8 0 0 1-5.6 0H2.5Z" />
    </>
  ),
  gatepass: (
    <>
      <path d="M11 2.5 4 3.8v13.4l7 1.3V2.5Z" />
      <path d="M11 3v14M14 3h3.5v14H14" />
      <circle cx="8.7" cy="10" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  storeIssue: (
    <>
      <path d="M10 13V3M6 7l4-4 4 4" />
      <path d="M3.5 13v3a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-3" />
    </>
  ),
  materialTransfer: (
    <>
      <path d="M4 7h9.5l-2.3-2.3M4 7l2.3 2.3" />
      <path d="M16 13H6.5l2.3 2.3M16 13l-2.3-2.3" />
    </>
  ),
  materialReturn: (
    <>
      <path d="M6 6 3 9l3 3" />
      <path d="M3 9h9a4 4 0 0 1 0 8h-2" />
    </>
  ),
  dashboard: (
    <>
      <rect x="2.5" y="2.5" width="7" height="6" rx="1" />
      <rect x="11.5" y="2.5" width="6" height="10" rx="1" />
      <rect x="2.5" y="10.5" width="7" height="7" rx="1" />
      <rect x="11.5" y="14.5" width="6" height="3" rx="1" />
    </>
  ),
  stockRegister: (
    <>
      <path d="M3 5.5l1.3 1.3L6.8 4.3M3 11.5l1.3 1.3 2.5-2.5M3 17.5l1.3 1.3 2.5-2.5" />
      <path d="M9.5 5.5h8M9.5 11.5h8M9.5 17.5h8" />
    </>
  ),
  fullReport: (
    <>
      <circle cx="8.5" cy="8.5" r="5" />
      <path d="M15.5 15.5 12.3 12.3" />
    </>
  ),
  stockValueByCategory: (
    <>
      <path d="M10 2.5v7.5h7.5A7.5 7.5 0 1 1 10 2.5Z" />
      <path d="M13 2.9A7.5 7.5 0 0 1 17.1 7H10l3-4.1Z" />
    </>
  ),
  lowStockAlert: (
    <>
      <path d="M10 3 18 16.5H2L10 3Z" />
      <path d="M10 8v4" />
      <circle cx="10" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  recentActivity: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.5V10l3 2" />
    </>
  ),
  storeWiseStock: (
    <>
      <path d="M2 8 10 3l8 5v8H2V8Z" />
      <path d="M7 16v-5h6v5" />
    </>
  ),
  closingStockQty: (
    <>
      <path d="M3.5 16.5V11M10 16.5V6.5M16.5 16.5V3.5" />
      <path d="M2.5 16.5h15" />
    </>
  ),
  stockValue: (
    <>
      <rect x="2.5" y="5" width="15" height="11" rx="1.8" />
      <path d="M2.5 8.5h15" />
      <circle cx="14.2" cy="12.2" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  activeEmployees: (
    <>
      <circle cx="7" cy="7" r="2.8" />
      <path d="M2 17c.6-3.1 2.4-4.7 5-4.7s4.4 1.6 5 4.7" />
      <circle cx="14.5" cy="7.5" r="2.2" />
      <path d="M13 12.5c2 .2 3.3 1.7 3.8 4" />
    </>
  ),
}

export function Icon({
  name,
  size = 17,
  ...props
}: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  const paths = PATHS[name]
  if (!paths) return null
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths}
    </svg>
  )
}
