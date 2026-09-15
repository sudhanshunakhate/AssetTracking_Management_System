/** Map document type code or report label to the transaction detail route. */
export function txnDetailPath(docType: string, docId: string | number | null | undefined): string | null {
  const id = String(docId ?? '').trim()
  if (!id) return null

  const raw = String(docType ?? '').trim()
  const aliases: Record<string, string> = {
    Opening: 'OPENING_STOCK',
    Issue: 'MATERIAL_ISSUE',
    Transfer: 'MATERIAL_TRANSFER',
    Return: 'MATERIAL_RETURN',
    Inspection: 'INSPECTION_APPROVAL',
    GRN: 'GRN',
    Requisition: 'MATERIAL_REQUISITION',
    GATEPASS_INWARD: 'GATEPASS_INWARD',
    GATEPASS_OUTWARD: 'GATEPASS_OUTWARD',
  }
  const code = aliases[raw] ?? raw

  const baseByType: Record<string, string> = {
    GRN: '/transactions/grn',
    OPENING_STOCK: '/transactions/opening-stock',
    MATERIAL_ISSUE: '/transactions/issues',
    MATERIAL_TRANSFER: '/transactions/transfers',
    MATERIAL_RETURN: '/transactions/returns',
    MATERIAL_REQUISITION: '/transactions/requisitions',
    INSPECTION_APPROVAL: '/transactions/inspection-approvals',
    GATEPASS_INWARD: '/transactions/gatepass/inward',
    GATEPASS_OUTWARD: '/transactions/gatepass/outward',
  }

  const base = baseByType[code]
  return base ? `${base}/${id}` : null
}

export function isTxnDetailNavigable(docType: string, docId: string | number | null | undefined): boolean {
  return txnDetailPath(docType, docId) != null
}
