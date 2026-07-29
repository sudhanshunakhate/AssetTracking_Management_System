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

export const units: Unit[] = [
  { id: '1', code: 'PCS', name: 'Pieces', description: 'Countable units', status: 'Active' },
  { id: '2', code: 'SET', name: 'Set', description: 'Bundled set of items', status: 'Active' },
  { id: '3', code: 'KG', name: 'Kilogram', description: 'Weight measure', status: 'Active' },
  { id: '4', code: 'GB', name: 'Gigabyte', description: 'Digital storage', status: 'Active' },
  { id: '5', code: 'LTR', name: 'Litre', description: 'Liquid volume', status: 'Inactive' },
]

export const items: Item[] = [
  { id: '1', code: 'ITM-001', name: 'Dell Latitude 5540 Laptop', itemType: 'asset', category: 'IT Assets', subCategory: 'Laptop', uom: 'PCS', standardCost: 78500, status: 'Active' },
  { id: '2', code: 'ITM-002', name: 'Cisco Catalyst 2960 Switch', itemType: 'asset', category: 'IT Assets', subCategory: 'Network', uom: 'PCS', standardCost: 42000, status: 'Active' },
  { id: '3', code: 'ITM-014', name: 'A4 Copier Paper Ream', itemType: 'consumable', category: 'Stationery', subCategory: 'Stationery', uom: 'BOX', standardCost: 280, status: 'Active' },
  { id: '4', code: 'ITM-022', name: 'MS Office 365 License', itemType: 'asset', category: 'Digital', subCategory: 'License', uom: 'LICENSE', standardCost: 6500, status: 'Active' },
  { id: '5', code: 'ITM-031', name: 'Thermal Grease Tube', itemType: 'consumable', category: 'Consumables', subCategory: 'Spare Part', uom: 'PCS', standardCost: 120, status: 'Inactive' },
]

export const vendors: Vendor[] = [
  { id: '1', code: 'VND-001', name: 'TechSource India Pvt Ltd', partyType: 'Vendor', city: 'Mumbai', phone: '9822012345', gstin: '27AABCT1234A1Z5', status: 'Active' },
  { id: '2', code: 'VND-002', name: 'Nagpur Office Supplies', partyType: 'Supplier', city: 'Nagpur', phone: '9876543210', gstin: '27AABCN9988B1Z2', status: 'Active' },
  { id: '3', code: 'VND-003', name: 'InfraBuild Contractors', partyType: 'Contractor', city: 'Pune', phone: '9988776655', gstin: '27AABCI5566C1Z9', status: 'Active' },
  { id: '4', code: 'VND-004', name: 'Internal Transfer Party', partyType: 'Internal', city: 'Nagpur', phone: '0712-2223344', gstin: '', status: 'Inactive' },
]

export const organizations: Organization[] = [
  { id: '1', code: 'ORG-001', name: 'Micropro India 4', shortName: 'MP-IN4', city: 'Nagpur', gstin: '27AABCM3451B1ZY', status: 'Active' },
  { id: '2', code: 'ORG-002', name: 'Micropro Software Solutions Ltd', shortName: 'MP-SSL', city: 'Mumbai', gstin: '27AABCM3451B2ZX', status: 'Active' },
]

export const operatingUnits: OperatingUnit[] = [
  { id: '1', code: 'OU-NGP-01', name: 'Nagpur Operations', orgCode: 'ORG-001', orgName: 'Micropro India 4', ouType: 'Branch', city: 'Nagpur', status: 'Active' },
  { id: '2', code: 'OU-MUM-01', name: 'Mumbai Operations', orgCode: 'ORG-002', orgName: 'Micropro Software Solutions Ltd', ouType: 'Region', city: 'Mumbai', status: 'Active' },
  { id: '3', code: 'OU-PUN-01', name: 'Pune Plant', orgCode: 'ORG-001', orgName: 'Micropro India 4', ouType: 'Plant', city: 'Pune', status: 'Inactive' },
]

export const stores: Store[] = [
  { id: '1', code: 'STR-FM-NGP', name: 'FM Store – Nagpur', storeType: 'FM', orgCode: 'ORG-001', ouCode: 'OU-NGP-01', city: 'Nagpur', status: 'Active' },
  { id: '2', code: 'STR-NGP-01', name: 'Store (General) – Nagpur', storeType: 'General Store', orgCode: 'ORG-001', ouCode: 'OU-NGP-01', city: 'Nagpur', status: 'Active' },
  { id: '3', code: 'STR-NGP-02', name: 'Quarantine Store – Nagpur', storeType: 'Quarantine', orgCode: 'ORG-001', ouCode: 'OU-NGP-01', city: 'Nagpur', status: 'Active' },
  { id: '4', code: 'STR-MUM-01', name: 'Store (General) – Mumbai', storeType: 'General Store', orgCode: 'ORG-002', ouCode: 'OU-MUM-01', city: 'Mumbai', status: 'Active' },
]

export const inventoryCategories: InventoryCategory[] = [
  { id: '1', code: 'CAT-IT', name: 'IT Assets', description: 'Computers, network and peripherals', status: 'Active' },
  { id: '2', code: 'CAT-PH', name: 'Physical Assets', description: 'Machinery and equipment', status: 'Active' },
  { id: '3', code: 'CAT-DG', name: 'Digital', description: 'Licenses and subscriptions', status: 'Active' },
  { id: '4', code: 'CAT-CS', name: 'Consumables', description: 'Day-to-day consumable stock', status: 'Active' },
  { id: '5', code: 'CAT-ST', name: 'Stationery', description: 'Office stationery', status: 'Active' },
]

export const inventorySubCategories: InventorySubCategory[] = [
  { id: '1', code: 'SUB-LAP', name: 'Laptop', parentCode: 'CAT-IT', parentName: 'IT Assets', status: 'Active' },
  { id: '2', code: 'SUB-NET', name: 'Network', parentCode: 'CAT-IT', parentName: 'IT Assets', status: 'Active' },
  { id: '3', code: 'SUB-MCH', name: 'Machinery', parentCode: 'CAT-PH', parentName: 'Physical Assets', status: 'Active' },
  { id: '4', code: 'SUB-LIC', name: 'License', parentCode: 'CAT-DG', parentName: 'Digital', status: 'Active' },
  { id: '5', code: 'SUB-STA', name: 'Stationery', parentCode: 'CAT-ST', parentName: 'Stationery', status: 'Active' },
]

export const generalTypes: GeneralType[] = [
  { id: '1', code: 'GTY-PYT', name: 'Payment Terms', description: 'Vendor payment term options', status: 'Active' },
  { id: '2', code: 'GTY-DOC', name: 'Document Type', description: 'Document classification', status: 'Active' },
  { id: '3', code: 'GTY-PRI', name: 'Priority', description: 'Request priority levels', status: 'Active' },
  { id: '4', code: 'GTY-REJ', name: 'Rejection Reason', description: 'Standard rejection reasons', status: 'Active' },
]

export const generalMasters: GeneralMaster[] = [
  { id: '1', code: 'GNM-N30', name: 'Net 30', typeCode: 'GTY-PYT', typeName: 'Payment Terms', sortOrder: 1, status: 'Active' },
  { id: '2', code: 'GNM-N45', name: 'Net 45', typeCode: 'GTY-PYT', typeName: 'Payment Terms', sortOrder: 2, status: 'Active' },
  { id: '3', code: 'GNM-INV', name: 'Invoice', typeCode: 'GTY-DOC', typeName: 'Document Type', sortOrder: 1, status: 'Active' },
  { id: '4', code: 'GNM-HIGH', name: 'High', typeCode: 'GTY-PRI', typeName: 'Priority', sortOrder: 1, status: 'Active' },
  { id: '5', code: 'GNM-QLTY', name: 'Quality Issue', typeCode: 'GTY-REJ', typeName: 'Rejection Reason', sortOrder: 1, status: 'Inactive' },
]

export const roles: AccessRole[] = [
  { id: '1', code: 'SUPER_ADMIN', name: 'Super Administrator', level: 10, description: 'Full system access', systemRole: true, status: 'Active' },
  { id: '2', code: 'IT_ADMIN', name: 'IT Administrator', level: 8, description: 'IT asset and user administration', systemRole: true, status: 'Active' },
  { id: '3', code: 'STORE_MANAGER', name: 'Store Manager', level: 7, description: 'Store operations and approvals', systemRole: false, status: 'Active' },
  { id: '4', code: 'ASSET_MANAGER', name: 'Asset Manager', level: 6, description: 'Asset lifecycle management', systemRole: false, status: 'Active' },
  { id: '5', code: 'VIEWER', name: 'Read-Only Viewer', level: 1, description: 'View-only access', systemRole: false, status: 'Active' },
]

export const employees: Employee[] = [
  { id: '1', code: 'EMP-001', firstName: 'Aditya', lastName: 'Kulkarni', designation: 'System Administrator', department: 'IT', email: 'aditya.kulkarni@micropro.in', role: 'SUPER_ADMIN', baseStore: 'STR-NGP-01', status: 'Active' },
  { id: '2', code: 'EMP-002', firstName: 'Priya', lastName: 'Sharma', designation: 'Store Manager', department: 'Stores', email: 'priya.sharma@micropro.in', role: 'STORE_MANAGER', baseStore: 'STR-NGP-01', status: 'Active' },
  { id: '3', code: 'EMP-005', firstName: 'Vikram', lastName: 'Joshi', designation: 'Asset Manager', department: 'Operations', email: 'vikram.joshi@micropro.in', role: 'ASSET_MANAGER', baseStore: 'STR-FM-NGP', status: 'Active' },
  { id: '4', code: 'EMP-007', firstName: 'Suresh', lastName: 'Bagde', designation: 'Store Keeper', department: 'Stores', email: 'suresh.bagde@micropro.in', role: 'STORE_KEEPER', baseStore: 'STR-NGP-02', status: 'Active' },
  { id: '5', code: 'EMP-010', firstName: 'Meena', lastName: 'Patil', designation: 'Analyst', department: 'Finance', email: 'meena.patil@micropro.in', role: 'VIEWER', baseStore: 'STR-MUM-01', status: 'Inactive' },
]

export const users: UserLogin[] = [
  { id: '1', loginId: 'aditya.kulkarni', employeeCode: 'EMP-001', employeeName: 'Aditya Kulkarni', role: 'SUPER_ADMIN', orgCode: 'ORG-001', ouScope: 'All', accountStatus: 'Active', status: 'Active' },
  { id: '2', loginId: 'priya.sharma', employeeCode: 'EMP-002', employeeName: 'Priya Sharma', role: 'STORE_MANAGER', orgCode: 'ORG-001', ouScope: 'OU-NGP-01', accountStatus: 'Active', status: 'Active' },
  { id: '3', loginId: 'vikram.joshi', employeeCode: 'EMP-005', employeeName: 'Vikram Joshi', role: 'ASSET_MANAGER', orgCode: 'ORG-001', ouScope: 'All', accountStatus: 'Active', status: 'Active' },
  { id: '4', loginId: 'meena.patil', employeeCode: 'EMP-010', employeeName: 'Meena Patil', role: 'VIEWER', orgCode: 'ORG-002', ouScope: 'OU-MUM-01', accountStatus: 'Locked', status: 'Inactive' },
]

export const exceptions: AccessException[] = [
  { id: '1', employeeCode: 'EMP-007', employeeName: 'Suresh Bagde', exceptionType: 'Grant', menuItem: 'Goods Receipt Note', reason: 'Cover during leave', validFrom: '2026-07-01', validUntil: '2026-08-31', status: 'Active' },
  { id: '2', employeeCode: 'EMP-010', employeeName: 'Meena Patil', exceptionType: 'Revoke', menuItem: 'User Login', reason: 'Finance scope only', validFrom: '2026-06-01', validUntil: '2026-12-31', status: 'Active' },
  { id: '3', employeeCode: 'EMP-002', employeeName: 'Priya Sharma', exceptionType: 'Grant', menuItem: 'Access Role', reason: 'Temporary admin assist', validFrom: '2026-07-15', validUntil: '2026-07-30', status: 'Inactive' },
]

export const dashboardData = {
  kpis: [
    { id: 'assets', label: 'Active Assets', value: 1284, hint: '+24 this month' },
    { id: 'items', label: 'Item Masters', value: 862, hint: '74 inactive' },
    { id: 'stock', label: 'Stock Value (₹L)', value: 186, hint: 'Across 4 stores' },
    { id: 'low', label: 'Low Stock Alerts', value: 17, hint: 'Needs reorder' },
    { id: 'users', label: 'Active Users', value: 46, hint: '3 locked' },
  ],
  categoryValues: [
    { name: 'IT Assets', value: 72 },
    { name: 'Physical', value: 41 },
    { name: 'Digital', value: 28 },
    { name: 'Consumables', value: 19 },
    { name: 'Stationery', value: 12 },
  ],
  lowStock: [
    { code: 'ITM-014', name: 'A4 Copier Paper Ream', store: 'STR-NGP-01', qty: 8, reorder: 25 },
    { code: 'ITM-031', name: 'Thermal Grease Tube', store: 'STR-FM-NGP', qty: 2, reorder: 10 },
    { code: 'ITM-044', name: 'CAT6 Patch Cable', store: 'STR-MUM-01', qty: 12, reorder: 40 },
  ],
  activity: [
    { when: '10 min ago', text: 'GRN-2026-118 posted at STR-NGP-01', by: 'priya.sharma' },
    { when: '42 min ago', text: 'Item ITM-001 assigned to EMP-005', by: 'vikram.joshi' },
    { when: '2 hrs ago', text: 'Store Requisition SR-452 approved', by: 'priya.sharma' },
    { when: 'Yesterday', text: 'Opening stock loaded for STR-MUM-01', by: 'aditya.kulkarni' },
  ],
  storeStock: [
    { code: 'STR-NGP-01', name: 'Store (General) – Nagpur', items: 412, value: 64.2 },
    { code: 'STR-FM-NGP', name: 'FM Store – Nagpur', items: 286, value: 51.8 },
    { code: 'STR-MUM-01', name: 'Store (General) – Mumbai', items: 198, value: 42.5 },
    { code: 'STR-NGP-02', name: 'Quarantine Store – Nagpur', items: 44, value: 8.1 },
  ],
}

export const menuAccessMatrix = [
  { role: 'SUPER_ADMIN', dashboard: true, masters: true, transactions: true, reports: true, admin: true },
  { role: 'IT_ADMIN', dashboard: true, masters: true, transactions: false, reports: true, admin: true },
  { role: 'STORE_MANAGER', dashboard: true, masters: true, transactions: true, reports: true, admin: false },
  { role: 'ASSET_MANAGER', dashboard: true, masters: true, transactions: true, reports: true, admin: false },
  { role: 'VIEWER', dashboard: true, masters: true, transactions: false, reports: true, admin: false },
]

export const openingStocks = [
  { id: '1', entryNo: 'OPN-2026-001', item: 'ITM-014 – A4 Copier Paper Ream', store: 'STR-NGP-01', batch: 'BATCH-001', qty: 120, uom: 'BOX', rate: 350, openingDate: '2026-07-01', status: 'Active' },
  { id: '2', entryNo: 'OPN-2026-002', item: 'ITM-001 – Dell Latitude 5540 Laptop', store: 'STR-FM-NGP', batch: '', qty: 15, uom: 'PCS', rate: 78500, openingDate: '2026-07-01', status: 'Active' },
  { id: '3', entryNo: 'OPN-2026-003', item: 'ITM-031 – Thermal Grease Tube', store: 'STR-MUM-01', batch: 'BATCH-T09', qty: 40, uom: 'PCS', rate: 120, openingDate: '2026-07-05', status: 'Active' },
]

export const requisitions = [
  { id: '1', reqNo: 'MR-2026-001', date: '2026-07-14', requestedBy: 'EMP-007 – Suresh Bagde', department: 'Stores', deliverTo: 'STR-NGP-01', designation: 'Supervisor', status: 'Approved' as const },
  { id: '2', reqNo: 'MR-2026-002', date: '2026-07-12', requestedBy: 'EMP-005 – Vikram Joshi', department: 'IT', deliverTo: 'STR-FM-NGP', designation: 'Asset Manager', status: 'Approved' as const },
  { id: '3', reqNo: 'MR-2026-000', date: '2026-07-05', requestedBy: 'EMP-002 – Priya Sharma', department: 'Operations', deliverTo: 'STR-NGP-01', designation: 'Store Manager', status: 'Issued' as const },
  { id: '4', reqNo: 'MR-2026-003', date: '2026-07-20', requestedBy: 'EMP-010 – Meena Patil', department: 'Finance', deliverTo: 'STR-MUM-01', designation: 'Analyst', status: 'Draft' as const },
]

export const grns = [
  { id: '1', grnNo: 'GRN-2026-001', grnDate: '2026-07-18', supplier: 'VND-001 – TechSource India Pvt Ltd', store: 'STR-NGP-01', totalItems: 2, totalAmount: 46500, status: 'Completed' },
  { id: '2', grnNo: 'GRN-2026-002', grnDate: '2026-07-22', supplier: 'VND-002 – Nagpur Office Supplies', store: 'STR-NGP-01', totalItems: 5, totalAmount: 8400, status: 'Completed' },
  { id: '3', grnNo: 'GRN-2026-003', grnDate: '2026-07-28', supplier: 'VND-001 – TechSource India Pvt Ltd', store: 'STR-FM-NGP', totalItems: 1, totalAmount: 78500, status: 'Draft' },
]

export const storeIssues = [
  { id: '1', issueNo: 'ISS-2026-001', date: '2026-07-15', requisitionNo: 'MR-2026-001', store: 'STR-NGP-01', issuedTo: 'EMP-007 – Suresh Bagde', totalItems: 3, status: 'Issued' as const },
  { id: '2', issueNo: 'ISS-2026-002', date: '2026-07-13', requisitionNo: 'MR-2026-002', store: 'STR-FM-NGP', issuedTo: 'EMP-005 – Vikram Joshi', totalItems: 1, status: 'Issued' as const },
  { id: '3', issueNo: 'ISS-2026-003', date: '2026-07-21', requisitionNo: 'MR-2026-003', store: 'STR-MUM-01', issuedTo: 'EMP-010 – Meena Patil', totalItems: 2, status: 'Draft' as const },
]

export const transfers = [
  { id: '1', transferNo: 'TRF-2026-001', date: '2026-07-16', fromStore: 'STR-NGP-01', toStore: 'STR-FM-NGP', totalItems: 4, status: 'Completed' as const },
  { id: '2', transferNo: 'TRF-2026-002', date: '2026-07-24', fromStore: 'STR-MUM-01', toStore: 'STR-NGP-01', totalItems: 2, status: 'Done' as const },
  { id: '3', transferNo: 'TRF-2026-003', date: '2026-07-28', fromStore: 'STR-NGP-01', toStore: 'STR-NGP-02', totalItems: 1, status: 'Draft' as const },
]

export const returns = [
  { id: '1', returnNo: 'RTN-2026-001', date: '2026-07-17', returnedBy: 'EMP-007 – Suresh Bagde', store: 'STR-NGP-01', totalItems: 2, status: 'Completed' as const },
  { id: '2', returnNo: 'RTN-2026-002', date: '2026-07-25', returnedBy: 'EMP-005 – Vikram Joshi', store: 'STR-FM-NGP', totalItems: 1, status: 'Done' as const },
]

export const stockRegister = [
  { id: '1', itemCode: 'ITM-001', itemName: 'Dell Latitude 5540 Laptop', category: 'IT Assets', uom: 'PCS', store: 'STR-FM-NGP', opening: 15, inward: 3, outward: 2, closing: 16, reorderLevel: 5, value: 1256000, status: 'In Stock' as const },
  { id: '2', itemCode: 'ITM-014', itemName: 'A4 Copier Paper Ream', category: 'Stationery', uom: 'BOX', store: 'STR-NGP-01', opening: 120, inward: 40, outward: 152, closing: 8, reorderLevel: 25, value: 2240, status: 'Low Stock' as const },
  { id: '3', itemCode: 'ITM-002', itemName: 'Cisco Catalyst 2960 Switch', category: 'IT Assets', uom: 'PCS', store: 'STR-NGP-01', opening: 6, inward: 2, outward: 1, closing: 7, reorderLevel: 2, value: 294000, status: 'In Stock' as const },
  { id: '4', itemCode: 'ITM-031', itemName: 'Thermal Grease Tube', category: 'Consumables', uom: 'PCS', store: 'STR-FM-NGP', opening: 40, inward: 0, outward: 38, closing: 2, reorderLevel: 10, value: 240, status: 'Low Stock' as const },
  { id: '5', itemCode: 'ITM-022', itemName: 'MS Office 365 License', category: 'Digital', uom: 'LICENSE', store: 'STR-MUM-01', opening: 20, inward: 10, outward: 30, closing: 0, reorderLevel: 5, value: 0, status: 'Out of Stock' as const },
]

export const fullReport = [
  { id: '1', date: '2026-07-18', txnType: 'Goods Receipt Note (GRN)', txnNo: 'GRN-2026-001', item: 'ITM-002 – Cisco Switch', category: 'IT Assets', qty: 2, uom: 'PCS', fromLocation: 'Vendor', toLocation: 'STR-NGP-01', organization: 'ORG-001', operatingUnit: 'OU-NGP-01', employee: 'Priya Sharma', user: 'priya.sharma', status: 'Completed', value: 46500 },
  { id: '2', date: '2026-07-15', txnType: 'Store Issue', txnNo: 'ISS-2026-001', item: 'ITM-014 – A4 Paper', category: 'Stationery', qty: 20, uom: 'BOX', fromLocation: 'STR-NGP-01', toLocation: 'Stores Dept', organization: 'ORG-001', operatingUnit: 'OU-NGP-01', employee: 'Suresh Bagde', user: 'priya.sharma', status: 'Issued', value: 5600 },
  { id: '3', date: '2026-07-16', txnType: 'Material Transfer', txnNo: 'TRF-2026-001', item: 'ITM-001 – Dell Laptop', category: 'IT Assets', qty: 2, uom: 'PCS', fromLocation: 'STR-NGP-01', toLocation: 'STR-FM-NGP', organization: 'ORG-001', operatingUnit: 'OU-NGP-01', employee: 'Vikram Joshi', user: 'vikram.joshi', status: 'Completed', value: 157000 },
  { id: '4', date: '2026-07-14', txnType: 'Store Requisition', txnNo: 'MR-2026-001', item: 'ITM-014 – A4 Paper', category: 'Stationery', qty: 25, uom: 'BOX', fromLocation: '—', toLocation: 'STR-NGP-01', organization: 'ORG-001', operatingUnit: 'OU-NGP-01', employee: 'Suresh Bagde', user: 'suresh.bagde', status: 'Approved', value: 7000 },
  { id: '5', date: '2026-07-17', txnType: 'Material Return', txnNo: 'RTN-2026-001', item: 'ITM-031 – Thermal Grease', category: 'Consumables', qty: 5, uom: 'PCS', fromLocation: 'IT Dept', toLocation: 'STR-NGP-01', organization: 'ORG-001', operatingUnit: 'OU-NGP-01', employee: 'Suresh Bagde', user: 'priya.sharma', status: 'Completed', value: 600 },
  { id: '6', date: '2026-07-01', txnType: 'Opening Stock', txnNo: 'OPN-2026-001', item: 'ITM-014 – A4 Paper', category: 'Stationery', qty: 120, uom: 'BOX', fromLocation: '—', toLocation: 'STR-NGP-01', organization: 'ORG-001', operatingUnit: 'OU-NGP-01', employee: 'Aditya Kulkarni', user: 'aditya.kulkarni', status: 'Done', value: 42000 },
]
