export type Status = 'Active' | 'Inactive'

export interface Unit {
  id: string
  code: string
  name: string
  description: string
  status: Status
}

export interface Item {
  id: string
  code: string
  name: string
  itemType: 'asset' | 'consumable'
  category: string
  subCategory: string
  uom: string
  standardCost: number
  store?: string
  status: Status
}

export interface Vendor {
  id: string
  code: string
  name: string
  partyType: string
  city: string
  phone: string
  gstin: string
  rating?: number | string
  status: Status
}

export interface Organization {
  id: string
  code: string
  name: string
  shortName: string
  city: string
  gstin: string
  status: Status
}

export interface OperatingUnit {
  id: string
  code: string
  name: string
  orgCode: string
  orgName: string
  ouType: string
  city: string
  status: Status
}

export interface Store {
  id: string
  code: string
  name: string
  storeType: string
  orgCode: string
  ouCode: string
  city: string
  isSystemLocation?: boolean
  systemRole?: string
  printLocationName?: string
  status: Status
}

export interface InventoryCategory {
  id: string
  code: string
  name: string
  description: string
  status: Status
}

export interface InventorySubCategory {
  id: string
  code: string
  name: string
  parentCode: string
  parentName: string
  status: Status
}

export interface GeneralType {
  id: string
  code: string
  name: string
  description: string
  status: Status
}

export interface GeneralMaster {
  id: string
  code: string
  name: string
  typeCode: string
  typeName: string
  sortOrder: number
  status: Status
}

export interface AccessRole {
  id: string
  code: string
  name: string
  description: string
  systemRole: boolean
  status: Status
}

export interface Department {
  id: string
  code: string
  name: string
  orgCode: string
  ouCode: string
  ouName: string
  locationId: string
  locationCode: string
  locationName: string
  headEmpId: string
  headEmpName: string
  description: string
  status: Status
}

export interface Employee {
  id: string
  code: string
  firstName: string
  lastName: string
  gender?: string
  dob?: string
  joiningDate?: string
  employmentType?: string
  designation: string
  department: string
  email: string
  phone?: string
  altPhone?: string
  role: string
  baseStore: string
  reportingTo?: string
  hasLogin?: boolean
  status: Status
}

export interface UserLogin {
  id: string
  loginId: string
  employeeCode: string
  employeeName: string
  role: string
  orgCode: string
  ouScope: string
  locationId?: string
  ouIds?: string[]
  locationScope?: string
  locationIds?: string[]
  accountStatus: 'Active' | 'Locked' | 'Disabled'
  status: Status
}

export interface AccessException {
  id: string
  employeeCode: string
  employeeName: string
  exceptionType: 'Grant' | 'Revoke'
  menuItem: string
  reason: string
  validFrom: string
  validUntil: string
  status: Status
}
