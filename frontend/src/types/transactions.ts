export type TxnStatus = 'Draft' | 'Approved' | 'Pending' | 'Issued' | 'Completed' | 'Done'

export interface OpeningStock {
  id: string
  entryNo: string
  item: string
  store: string
  batch: string
  qty: number
  uom: string
  rate: number
  openingDate: string
  status: string
}

export interface StoreRequisition {
  id: string
  reqNo: string
  date: string
  requestedBy: string
  department: string
  deliverTo: string
  designation: string
  status: TxnStatus
}

export interface Grn {
  id: string
  grnNo: string
  grnDate: string
  supplier: string
  store: string
  totalItems: number
  totalAmount: number
  status: string
}

export interface StoreIssue {
  id: string
  issueNo: string
  date: string
  requisitionNo: string
  store: string
  issuedTo: string
  totalItems: number
  status: TxnStatus
}

export interface MaterialTransfer {
  id: string
  transferNo: string
  date: string
  fromStore: string
  toStore: string
  totalItems: number
  status: TxnStatus
}

export interface MaterialReturn {
  id: string
  returnNo: string
  date: string
  returnedBy: string
  store: string
  totalItems: number
  status: TxnStatus
}

export interface StockRegisterRow {
  id: string
  itemCode: string
  itemName: string
  category: string
  uom: string
  store: string
  opening: number
  inward: number
  outward: number
  closing: number
  reorderLevel: number
  value: number
  status: 'In Stock' | 'Low Stock' | 'Out of Stock'
}

export interface FullReportRow {
  id: string
  date: string
  txnType: string
  txnNo: string
  item: string
  category: string
  qty: number
  uom: string
  fromLocation: string
  toLocation: string
  organization: string
  operatingUnit: string
  employee: string
  user: string
  status: string
  value: number
}
