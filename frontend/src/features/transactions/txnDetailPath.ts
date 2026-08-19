/** Map document type code to the transaction detail route for a header id. */
export function txnDetailPath(docType: string, docId: string | number | null | undefined): string | null {
  const id = String(docId ?? '').trim()
  if (!id) return null

  const baseByType: Record<string, string> = {
    GRN: '/transactions/grn',
    OPENING_STOCK: '/transactions/opening-stock',
    MATERIAL_ISSUE: '/transactions/issues',
    MATERIAL_TRANSFER: '/transactions/transfers',
    MATERIAL_RETURN: '/transactions/returns',
    MATERIAL_REQUISITION: '/transactions/requisitions',
    INSPECTION_APPROVAL: '/transactions/inspection-approvals',
  }

  const base = baseByType[docType]
  return base ? `${base}/${id}` : null
}

export function isTxnDetailNavigable(docType: string, docId: string | number | null | undefined): boolean {
  return txnDetailPath(docType, docId) != null
}
