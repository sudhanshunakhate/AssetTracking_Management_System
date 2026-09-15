import type {
  AccessException,
  AccessRole,
  Employee,
  GeneralMaster,
  GeneralType,
  InventoryCategory,
  InventorySubCategory,
  Item,
  OperatingUnit,
  Organization,
  Store,
  Unit,
  UserLogin,
  Vendor,
} from '@/types/masters'
import type {
  FullReportRow,
  Grn,
  MaterialReturn,
  MaterialTransfer,
  OpeningStock,
  StockRegisterRow,
  StoreIssue,
  StoreRequisition,
} from '@/types/transactions'

/** Intentionally empty — UI loads from API / stays blank for fresh testing. */
export const units: Unit[] = []
export const items: Item[] = []
export const vendors: Vendor[] = []
export const organizations: Organization[] = []
export const operatingUnits: OperatingUnit[] = []
export const stores: Store[] = []
export const inventoryCategories: InventoryCategory[] = []
export const inventorySubCategories: InventorySubCategory[] = []
export const generalTypes: GeneralType[] = []
export const generalMasters: GeneralMaster[] = []
export const roles: AccessRole[] = []
export const employees: Employee[] = []
export const users: UserLogin[] = []
export const exceptions: AccessException[] = []
export const menuAccessMatrix: Array<{
  role: string
  dashboard: boolean
  masters: boolean
  transactions: boolean
  reports: boolean
  admin: boolean
}> = []
export const openingStocks: OpeningStock[] = []
export const requisitions: StoreRequisition[] = []
export const grns: Grn[] = []
export const storeIssues: StoreIssue[] = []
export const transfers: MaterialTransfer[] = []
export const returns: MaterialReturn[] = []
export const stockRegister: StockRegisterRow[] = []
export const fullReport: FullReportRow[] = []

export const dashboardData = {
  kpis: [
    { id: 'assets', label: 'Active Assets', value: 0, hint: 'No data yet' },
    { id: 'items', label: 'Item Masters', value: 0, hint: 'No data yet' },
    { id: 'stock', label: 'Stock Value (₹L)', value: 0, hint: 'No data yet' },
    { id: 'low', label: 'Low Stock Alerts', value: 0, hint: 'No data yet' },
    { id: 'users', label: 'Active Users', value: 0, hint: 'No data yet' },
  ],
  categoryValues: [] as { name: string; value: number }[],
  lowStock: [] as { code: string; name: string; store: string; qty: number; reorder: number }[],
  activity: [] as { when: string; text: string; by: string }[],
  storeStock: [] as { code: string; name: string; items: number; value: number }[],
}
