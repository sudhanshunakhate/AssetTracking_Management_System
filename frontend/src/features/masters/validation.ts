/**
 * Declarative validation rules shared by the master forms.
 * Rules are attached to a FieldDef and evaluated by SimpleMasterModule / MasterForm.
 */

export type ValidationRules = {
  required?: boolean
  minLength?: number
  maxLength?: number
  /** Regex the trimmed value must match (only checked when a value is present). */
  pattern?: RegExp
  /** Message shown when `pattern` fails. */
  patternMessage?: string
  min?: number
  max?: number
  integer?: boolean
  /** Reject a value already used by another row of the same list (case-insensitive). */
  unique?: boolean
  uniqueMessage?: string
  /** Cross-field / bespoke check. Return an error message, or '' when valid. */
  validate?: (value: string, values: Record<string, unknown>) => string
}

export type ValidatableField = ValidationRules & {
  name: string
  label: string
  type?: string
}

export const PATTERNS = {
  /** Uppercase code: starts alphanumeric, then alphanumeric / - / _ / / */
  code: /^[A-Z0-9][A-Z0-9_/-]*$/,
  /** Letters, digits, spaces and common punctuation used in names. */
  name: /^[\w\s().,&'/-]+$/,
  /** Letters and spaces only — city, state, person names. */
  alphaSpace: /^[A-Za-z][A-Za-z\s.'-]*$/,
  email: /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/,
  /** Digits-only Indian mobile (10 digits starting 6–9, optional 91 prefix). */
  phone: /^\+?91[-\s]?[6-9]\d{9}$|^[6-9]\d{9}$/,
  gstin: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  pincode: /^[1-9][0-9]{5}$/,
  ipv4: /^((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})$/,
  mac: /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/,
  hostname: /^[A-Za-z0-9][A-Za-z0-9.-]*$/,
  isoDate: /^\d{4}-\d{2}-\d{2}$/,
} as const

/** Message helpers so wording stays identical across every master. */
export const MSG = {
  code: 'Use capital letters, digits, - or _ (no spaces)',
  name: 'Only letters, digits, spaces and ( ) . , & - / are allowed',
  alphaSpace: 'Only letters and spaces are allowed',
  email: 'Enter a valid email address, e.g. name@company.com',
  phone: 'Enter a valid 10-digit Indian mobile number',
  gstin: 'GSTIN must be 15 characters, e.g. 27ABCDE1234F1Z5',
  pan: 'PAN must be 10 characters, e.g. ABCDE1234F',
  pincode: 'PIN code must be 6 digits',
  ipv4: 'Enter a valid IPv4 address, e.g. 192.168.1.20',
  mac: 'Enter a valid MAC address, e.g. AA:BB:CC:DD:EE:FF',
} as const

/**
 * Rule presets — keeps the same limits and wording on every master form.
 * Spread them into a FieldDef, then override anything that differs.
 */
export const RULES = {
  /** Mandatory, unique, uppercase business code. */
  code: (maxLength = 20, minLength = 2): ValidationRules => ({
    required: true,
    minLength,
    maxLength,
    pattern: PATTERNS.code,
    patternMessage: MSG.code,
    unique: true,
  }),
  /** Mandatory descriptive name. */
  name: (maxLength = 120, minLength = 2): ValidationRules => ({
    required: true,
    minLength,
    maxLength,
    pattern: PATTERNS.name,
    patternMessage: MSG.name,
  }),
  /** Optional free text with a length cap. */
  text: (maxLength: number): ValidationRules => ({ maxLength }),
  city: (): ValidationRules => ({
    maxLength: 60,
    pattern: PATTERNS.alphaSpace,
    patternMessage: MSG.alphaSpace,
  }),
  email: (required = false): ValidationRules => ({
    required,
    maxLength: 120,
    pattern: PATTERNS.email,
    patternMessage: MSG.email,
  }),
  phone: (required = false): ValidationRules => ({
    required,
    maxLength: 15,
    validate: (value) => {
      if (!value.trim()) return ''
      let digits = value.replace(/\D/g, '')
      if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
      return /^[6-9]\d{9}$/.test(digits) ? '' : MSG.phone
    },
  }),
  gstin: (): ValidationRules => ({
    minLength: 15,
    maxLength: 15,
    pattern: PATTERNS.gstin,
    patternMessage: MSG.gstin,
  }),
  pan: (): ValidationRules => ({
    minLength: 10,
    maxLength: 10,
    pattern: PATTERNS.pan,
    patternMessage: MSG.pan,
  }),
  pincode: (): ValidationRules => ({
    minLength: 6,
    maxLength: 6,
    pattern: PATTERNS.pincode,
    patternMessage: MSG.pincode,
  }),
  select: (required = true): ValidationRules => ({ required }),
} as const

type Row = { id: string; [key: string]: unknown }

function asText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'boolean') return value ? 'true' : ''
  return String(value)
}

/**
 * Validates one field. Returns '' when the value is acceptable.
 * `rows` + `currentId` are only needed for `unique` rules.
 */
export function validateField(
  field: ValidatableField,
  values: Record<string, unknown>,
  rows: Row[] = [],
  currentId = 'new',
): string {
  if (field.type === 'switch') return ''

  const raw = asText(values[field.name])
  const value = raw.trim()

  if (!value) {
    return field.required ? `${field.label} is required` : ''
  }

  if (field.minLength && value.length < field.minLength) {
    return `${field.label} must be at least ${field.minLength} characters`
  }
  if (field.maxLength && value.length > field.maxLength) {
    return `${field.label} cannot exceed ${field.maxLength} characters`
  }
  if (field.pattern && !field.pattern.test(value)) {
    return field.patternMessage ?? `${field.label} format is invalid`
  }

  if (field.type === 'number' || field.min != null || field.max != null || field.integer) {
    const num = Number(value)
    if (!Number.isFinite(num)) return `${field.label} must be a number`
    if (field.integer && !Number.isInteger(num)) return `${field.label} must be a whole number`
    if (field.min != null && num < field.min) return `${field.label} cannot be less than ${field.min}`
    if (field.max != null && num > field.max) return `${field.label} cannot be more than ${field.max}`
  }

  if (field.type === 'date' && !PATTERNS.isoDate.test(value)) {
    return `${field.label} must be a valid date`
  }

  if (field.unique) {
    const clash = rows.some(
      (r) => String(r.id) !== String(currentId) && asText(r[field.name]).trim().toUpperCase() === value.toUpperCase(),
    )
    if (clash) return field.uniqueMessage ?? `${field.label} "${value}" already exists`
  }

  return field.validate?.(value, values) ?? ''
}

/** Validates every field; returns a map of field name → message for the failures only. */
export function validateFields(
  fields: ValidatableField[],
  values: Record<string, unknown>,
  rows: Row[] = [],
  currentId = 'new',
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const f of fields) {
    const msg = validateField(f, values, rows, currentId)
    if (msg) errors[f.name] = msg
  }
  return errors
}

/** True when every required field has a non-empty value (booleans always count as filled). */
export function areRequiredFieldsFilled(
  fields: { name: string; required?: boolean }[],
  values: Record<string, unknown>,
): boolean {
  return fields
    .filter((f) => f.required)
    .every((f) => {
      const v = values[f.name]
      if (v == null) return false
      if (typeof v === 'boolean') return true
      return String(v).trim() !== ''
    })
}

export const HEADER_BEFORE_LINES_HINT =
  'Complete all required header fields before selecting items.'

/** `validate` helper: the value must not be earlier than another date field. */
export function notBefore(otherField: string, otherLabel: string) {
  return (value: string, values: Record<string, unknown>): string => {
    const other = asText(values[otherField]).trim()
    if (!other || !value) return ''
    return value < other ? `Must be on or after ${otherLabel}` : ''
  }
}
