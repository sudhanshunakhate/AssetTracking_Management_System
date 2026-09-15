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
  mrp?: number
  openingDate: string
  mfgDate?: string
  expiryDate?: string
  org?: string
  supplier?: string
  remarks?: string
  status: string
}

export interface StoreRequisition {
  id: string
  reqNo: string
  reqType: 'DEPARTMENT' | 'EMPLOYEE'
  date: string
  requiredDate: string
  requestedBy: string
  employeeCode?: string
  department: string
  designation: string
  deliverTo: string
  attachmentUrl?: string
  remark?: string
  approvedBy?: string
  approvedDate?: string
  totalItems: number
  status: TxnStatus
}

export interface Grn {
  id: string
  grnNo: string
  grnDate: string
  supplier: string
  invoiceNo: string
  invoiceDate: string
  referenceDoc: string
  referenceDocDate: string
  store: string
  inspectedBy: string
  inspectionDate: string
  remarks: string
  totalReceivedQty: number
  totalAcceptedQty: number
  totalRejectedQty: number
  preparedBy: string
  preparedDate: string
  approvedBy: string
  approvedDate: string
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
  srNo: number
  itemName: string
  uom: string
  openingBalance: number
  receiptDuringPeriod: number
  issueDuringPeriod: number
  closingBalance: number
  ownerName: string
}

export interface FullReportRow {
  id: string
  docId: string
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
  department: string
  employee: string
  user: string
  status: string
  value: number
  serialNo: string
}
