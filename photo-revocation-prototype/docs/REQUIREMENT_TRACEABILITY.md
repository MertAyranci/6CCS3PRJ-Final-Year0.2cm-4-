# Requirement traceability (prototype)

Maps dissertation requirements (Chapter 3) to implementation artefacts and verification. **Implementation** = behaviour present in the Next.js prototype. **Manual test** = covered by `MANUAL_TEST_PLAN.md`. **Automated test** = Vitest unit tests for permission/time logic in `src/lib/photoModel.ts`.

## Functional requirements

| ID | Implementation summary | Manual test refs | Automated |
|----|-------------------------|------------------|-----------|
| FR1 | Pre-send picker + revocable composer | T-UC0 | — |
| FR2 | Prominent pre-send limitation alert in composer | T-FR2 | — |
| FR3 | Post-send photo menu + revocation permissions | T-UC1 | — |
| FR4 | Chips, placeholders, view-once overlay | T-UC2, T-FR4 | `computeEffectiveStatus` |
| FR5 | Live `PhotoPermissions` on source message; panel reflects selection | T-FR5 | — |
| FR6 | Summaries / inline feedback after send and permission changes | T-UC1 | — |
| FR7 | Forward gated by `canForward` + effective access | T-UC3, T-UC4 | `forwardingAllowed` |
| FR8 | Forwarded messages share `sourcePhotoId`; updates propagate | T-FR8 | — |
| FR9 | Distinct forwarded thread UI | T-UC5 | — |
| FR10 | Neutral recipient copy for revoked / changed access | T-UC2 | — |
| FR11 | Access request flow with sender decision | T-UC7 | — |
| FR12–FR16 | Co-subject flag, notification, revocation request, sender decision, propagation | T-UC6 | — |
| FR17 | Co-subject limitation disclaimers | T-FR17 | — |

## Non-functional requirements

| ID | Implementation summary | Manual test refs | Automated |
|----|-------------------------|------------------|-----------|
| NFR1–NFR4 | In-chat controls, labelled toggles, readable chips | T-UC0–T-UC2 | — |
| NFR5 | Local React state updates | T-NFR5 | — |
| NFR6 | Neutral system-style strings | (review copy during manual run) | — |
| NFR7 | WhatsApp-like chrome and patterns | T-NFR7 | — |
| NFR8 | Conceptual only (no crypto in prototype) | — | — |
| NFR9 | Honest limitation copy | T-NFR9 | — |

## Automated tests (Vitest)

| Suite | File | What is verified |
|-------|------|------------------|
| `photoModel` | `src/lib/photoModel.test.ts` | Effective access after expiry; forwarding rule; duration and countdown formatting |

Run: `npm test`
