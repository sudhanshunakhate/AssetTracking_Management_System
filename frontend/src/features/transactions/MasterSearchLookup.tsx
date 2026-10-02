import { useMemo } from 'react'
import { useMasterSearch, type ApiMasterRow } from '@/api/masters'
import { FilterableLookup, type FilterableOption } from '@/features/transactions/lineGrid'

function rowToOption(r: ApiMasterRow): FilterableOption {
  const code = String(r.code ?? '')
  const name = String(r.name ?? '')
  const label = code && name ? `${code} - ${name}` : code || name || r.id
  return { value: r.id, label, searchText: `${code} ${name}` }
}

/** Server-backed item typeahead — scales without loading the full items catalog. */
export function MasterItemSearchLookup({
  value,
  onChange,
  disabled,
  invalid,
  placeholder = '— Select Item —',
  className,
  selectedLabel,
  allowClear = false,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
  className?: string
  /** Keep selected row visible even if not in the current search page. */
  selectedLabel?: string
  /** Adds an empty option so the user can clear back to “all”. */
  allowClear?: boolean
}) {
  const { setQ, rows, loading } = useMasterSearch('items')
  const options = useMemo(() => {
    const opts = rows.map(rowToOption)
    if (value && !opts.some((o) => o.value === value)) {
      opts.unshift({
        value,
        label: selectedLabel || value,
        searchText: selectedLabel || value,
      })
    }
    if (allowClear) {
      opts.unshift({ value: '', label: placeholder, searchText: placeholder })
    }
    return opts
  }, [rows, value, selectedLabel, allowClear, placeholder])

  return (
    <FilterableLookup
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      invalid={invalid}
      placeholder={placeholder}
      searchPlaceholder="Search item code or name…"
      className={className}
      onSearchChange={setQ}
      searching={loading}
    />
  )
}

/** Server-backed employee typeahead. */
export function MasterEmployeeSearchLookup({
  value,
  onChange,
  disabled,
  invalid,
  placeholder = '— Select Employee —',
  className,
  selectedLabel,
  /** When set, search locally in these options instead of hitting the employees API. */
  options: localOptions,
  allowClear = false,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
  className?: string
  selectedLabel?: string
  options?: FilterableOption[]
  allowClear?: boolean
}) {
  const server = useMasterSearch('employees')
  const useLocal = localOptions != null
  const options = useMemo(() => {
    const opts = useLocal
      ? [...localOptions]
      : server.rows.map(rowToOption)
    if (value && !opts.some((o) => o.value === value)) {
      opts.unshift({
        value,
        label: selectedLabel || value,
        searchText: selectedLabel || value,
      })
    }
    if (allowClear) {
      opts.unshift({ value: '', label: placeholder, searchText: placeholder })
    }
    return opts
  }, [useLocal, localOptions, server.rows, value, selectedLabel, allowClear, placeholder])

  return (
    <FilterableLookup
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      invalid={invalid}
      placeholder={placeholder}
      searchPlaceholder="Search employee code or name…"
      className={className}
      maxVisible={300}
      onSearchChange={useLocal ? undefined : server.setQ}
      searching={useLocal ? false : server.loading}
    />
  )
}
