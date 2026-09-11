# CAITS Data Exposure Matrix (Phase A deliverable)
# Generated: 2026-09-10 | Living doc — update when DTOs/endpoints change
# Classes: S0 PUBLIC | S1 INTERNAL | S2 PII | S3 SECRET | S4 REGULATED

| Field / Asset | Class | DB | API list | API detail | Network | React | Storage | Logs | Required on screen? |
|---|---|---|---|---|---|---|---|---|---|
| JWT session | S3 | n/a | n/a | n/a | Cookie only (HttpOnly) | never | CAITS_SESSION cookie | redacted | session |
| usr_password_hash | S3 | BCrypt | never | never | never | never | never | never | n/a |
| Login password body | S3 | n/a | RSA cipher only | n/a | `{cipher}` | clear only in form memory | never | redacted | login form |
| VAPID private key | S3 | env/server | never | never | never | never | never | never | n/a |
| VAPID public key | S0 | config | yes | yes | yes | yes | memory | ok | push subscribe |
| nps_p256dh / nps_auth | S3 | AES-GCM | never to UI | n/a | subscribe body once | Web Push API | never persisted by React | never | browser PushManager |
| Vendor PAN / GSTIN | S4 | AES-GCM | masked | full + S4 audit | list masked | edit form full | never | S4_VIEW id only | Vendor edit |
| Entity PAN / GSTIN | S4 | AES-GCM | masked | full + S4 audit + entity scope | list masked | edit form full | never | S4_VIEW id only | Org edit |
| txh_party_gstin | S4 | AES-GCM | omitted from list DTO | full on document | detail only | txn forms | never | never value | GRN/GP forms |
| Employee email/phone | S2 | plaintext | masked | full | list masked | employee form | never | never | Employee edit |
| Vendor email/phone | S2 | plaintext | masked | full | list masked | vendor form | never | never | Vendor edit |
| Item codes / qty / status | S1 | plaintext | yes | yes | yes | yes | UI state | ok | masters/txns |
| Menu labels / lookups | S0 | plaintext | yes | yes | yes | yes | UI state | ok | everywhere |
| Attachment file bytes | S1 | disk | download gated | download gated | binary | blob URL | never | never | txn attach |
| CSRF XSRF-TOKEN | S1 | n/a | cookie | cookie | cookie + header | readable cookie | cookie | redacted | mutations |

## Remaining browser limitation
Any field intentionally shown in the UI is visible in DevTools to the person using that browser. That is inherent to web apps — CAITS does not implement DevTools blockers or client-side “hide everything” encryption.
