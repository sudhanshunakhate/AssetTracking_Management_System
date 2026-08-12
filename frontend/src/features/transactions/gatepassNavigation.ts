/** React Router state key for prefilling Gatepass Outward from Material Transfer. */
export const GATEPASS_OUTWARD_PREFILL_KEY = 'gatepassOutwardPrefill'

export type GatepassOutwardNavState = {
  [GATEPASS_OUTWARD_PREFILL_KEY]: import('./transferGatepassBridge').GatepassOutwardPrefill
}
