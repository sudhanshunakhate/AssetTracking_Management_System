/** React Router state key for prefilling Gatepass Outward from Material Transfer. */
export const GATEPASS_OUTWARD_PREFILL_KEY = 'gatepassOutwardPrefill'

export const GATEPASS_BASE = '/transactions/gatepass'
export const GATEPASS_INWARD_PATH = `${GATEPASS_BASE}/inward`
export const GATEPASS_OUTWARD_PATH = `${GATEPASS_BASE}/outward`

export type GatepassOutwardNavState = {
  [GATEPASS_OUTWARD_PREFILL_KEY]: import('./transferGatepassBridge').GatepassOutwardPrefill
}
