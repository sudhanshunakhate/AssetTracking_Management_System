import { useRef, useState } from 'react'
import { openAuthenticatedFile } from '@/api/client'
import { uploadAttachment } from '@/api/transactions'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'

export type AttachmentValue = {
  url: string
  name: string
}

export function attachmentPayload(url: string, name: string) {
  return {
    attachmentUrl: url || undefined,
    attachmentName: name || undefined,
  }
}

export function AttachmentLink({
  url,
  name,
  empty = '—',
}: {
  url?: string | null
  name?: string | null
  empty?: string
}) {
  const [opening, setOpening] = useState(false)
  if (!url) return <span className="text-[var(--text3)]">{empty}</span>
  return (
    <button
      type="button"
      title={opening ? 'Opening…' : name?.trim() ? `View ${name.trim()}` : 'View attachment'}
      disabled={opening}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setOpening(true)
        void openAuthenticatedFile(url, name ?? undefined)
          .catch((err) => {
            window.alert(err instanceof Error ? err.message : 'Could not open attachment')
          })
          .finally(() => setOpening(false))
      }}
      className="truncate text-left text-[12px] font-medium text-[var(--accent)] underline disabled:opacity-60"
    >
      {opening ? 'Opening…' : 'View'}
    </button>
  )
}

export function AttachmentFields({
  url,
  name,
  readOnly = false,
  onChange,
  className = '',
}: {
  url: string
  name: string
  readOnly?: boolean
  onChange: (next: AttachmentValue) => void
  className?: string
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const onFilePicked = async (file?: File) => {
    if (!file || readOnly) return
    setUploading(true)
    setError('')
    try {
      const uploaded = await uploadAttachment(file)
      onChange({ url: uploaded.url, name: uploaded.originalName || uploaded.fileName })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
      onChange({ url: '', name: '' })
      if (fileInput.current) fileInput.current.value = ''
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4 ${className}`}>
      {!readOnly && (
        <Field
          label="Upload file"
          hint={uploading ? 'Uploading…' : error || 'Any document or image up to 10 MB'}
          error={error}
          className="md:col-span-2"
        >
          <input
            ref={fileInput}
            type="file"
            disabled={uploading}
            onChange={(e) => void onFilePicked(e.target.files?.[0])}
            className="w-full rounded-md border border-[var(--border2)] bg-[var(--surface)] px-2.5 py-1 text-[12px] text-[var(--text2)] file:mr-2 file:rounded file:border-0 file:bg-[var(--surface2)] file:px-2 file:py-1 file:text-[11.5px] file:font-semibold file:text-[var(--text2)]"
          />
        </Field>
      )}
      <Field label="Attached file" className="md:col-span-2">
        {url ? (
          <div className="flex min-h-[34px] items-center gap-2">
            <AttachmentLink url={url} name={name} />
            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  onChange({ url: '', name: '' })
                  if (fileInput.current) fileInput.current.value = ''
                }}
                className="text-[11px] font-semibold text-[var(--danger)]"
              >
                Remove
              </button>
            )}
          </div>
        ) : (
          <div className="min-h-[34px] text-[12.5px] text-[var(--text3)]">
            {readOnly ? 'No file attached' : 'No file selected'}
          </div>
        )}
      </Field>
    </div>
  )
}

export function AttachmentSection({
  url,
  name,
  readOnly = false,
  onChange,
  subtitle = 'Supporting document — invoice scan, delivery challan, or other file',
}: {
  url: string
  name: string
  readOnly?: boolean
  onChange: (next: AttachmentValue) => void
  subtitle?: string
}) {
  return (
    <Card>
      <CardHeader title="Attachments" subtitle={subtitle} />
      <CardBody>
        <AttachmentFields url={url} name={name} readOnly={readOnly} onChange={onChange} />
      </CardBody>
    </Card>
  )
}
