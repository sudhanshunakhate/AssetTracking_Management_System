import { useCallback, useState } from 'react'
import type { MasterImportDraftBase, MasterImportResult } from './MasterCsvImportPanel'

/** Shared upload / preview / save state for master CSV imports. */
export function useMasterCsvImportPreview<T extends MasterImportDraftBase>() {
  const [previewRows, setPreviewRows] = useState<T[]>([])
  const [importResult, setImportResult] = useState<MasterImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [savingImport, setSavingImport] = useState(false)

  const validPreviewCount = previewRows.filter((r) => !r.error).length
  const invalidPreviewCount = previewRows.filter((r) => r.error).length

  const setDrafts = useCallback((drafts: T[]) => {
    setImportResult(null)
    setPreviewRows(drafts)
  }, [])

  const removePreviewRow = useCallback((key: string) => {
    setPreviewRows((prev) => prev.filter((r) => r.key !== key))
  }, [])

  const updateDraft = useCallback((key: string, updater: (row: T) => T) => {
    setPreviewRows((prev) => prev.map((r) => (r.key === key ? updater(r) : r)))
  }, [])

  const clearPreview = useCallback(() => {
    setPreviewRows([])
    setImportResult(null)
  }, [])

  const runUpload = useCallback(async (fn: () => void | Promise<void>) => {
    setImporting(true)
    try {
      await fn()
    } finally {
      setImporting(false)
    }
  }, [])

  const runSave = useCallback(
    async (saveFn: (drafts: T[]) => Promise<MasterImportResult>, onCreated?: () => Promise<void>) => {
      const toSave = previewRows.filter((r) => !r.error)
      if (toSave.length === 0) {
        setImportResult({
          created: 0,
          failed: previewRows.map((r) => ({ row: r.sourceRow, message: r.error || 'Invalid row' })),
        })
        return
      }
      setSavingImport(true)
      try {
        const result = await saveFn(toSave)
        setImportResult(result)
        if (result.created > 0) {
          await onCreated?.()
          setPreviewRows([])
        }
      } finally {
        setSavingImport(false)
      }
    },
    [previewRows],
  )

  return {
    previewRows,
    importResult,
    importing,
    savingImport,
    validPreviewCount,
    invalidPreviewCount,
    setDrafts,
    removePreviewRow,
    updateDraft,
    clearPreview,
    runUpload,
    runSave,
  }
}
