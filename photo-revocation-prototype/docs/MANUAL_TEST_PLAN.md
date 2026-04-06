# Manual test plan — photo revocation prototype

Run the app with `npm run dev`, then execute each test in order. Record **Pass** / **Fail** and notes. This document supports the dissertation Implementation chapter (scenario-based verification).

## Use-case scenarios

| Test ID | Use case | Steps | Expected outcome | Result |
|--------|----------|-------|------------------|--------|
| T-UC0 | UC-S0 Pre-send configuration | Open sender **+** → select a preset photo → **Send with revocable permissions** → toggle forwarding, view once, download, co-subject, and optional time limit → send | New photo message appears in sender chat with chips matching chosen permissions | |
| T-UC1 | UC-S1 Post-send revision | Select photo → open **⋯** menu → **Revocation permissions** → toggle revoke / restore, forward, download, or time limit | Recipient (and forwarded copy if any) reflects updated state and chips | |
| T-UC2 | UC-R1 Recipient states | On recipient phone, view active photo; sender revokes; open view-once photo and close | Active shows image + chips; revoked shows placeholder; view-once opens full screen then blocks reopen | |
| T-UC3 | UC-R2 Forward when allowed | Enable **Forward** on sender; recipient opens menu → forward | Forwarded thread receives photo with inherited restrictions | |
| T-UC4 | UC-R2 Forward when blocked | Disable **Forward**; recipient opens menu | Forward action unavailable | |
| T-UC5 | UC-SR1 Secondary recipient | After forward, on secondary phone: sender revokes or waits for expiry | Forwarded instance shows same revoked / expired behaviour as main chat | |
| T-UC6 | UC-C1 Co-subject request | Send with **Co-subject**; on co-subject phone open menu → **Request revocation** → sender accept / reject | Pending request on sender; accept revokes linked photos; reject notifies co-subject | |
| T-UC7 | FR11 Access request | Sender revokes; recipient opens menu → request access; sender accept / reject | Accept restores visibility; reject shows outcome to recipient | |

## Spot checks for functional requirements (abbreviated)

| Test ID | FR | Check | Result |
|--------|-----|--------|--------|
| T-FR2 | FR2 | Pre-send limitation copy is visible at top of composer (`role="alert"`, larger amber text) | |
| T-FR4 | FR4 | Chips show visible/revoked, forward, view-once, download, expiry where applicable | |
| T-FR5 | FR5 | Permissions panel matches selected photo’s live state | |
| T-FR8 | FR8 | Changing source photo permissions updates forwarded message for same `sourcePhotoId` | |
| T-FR17 | FR17 | Co-subject area shows in-app-only / screenshot limitation copy | |

## Non-functional spot checks

| Test ID | NFR | Check | Result |
|--------|-----|--------|--------|
| T-NFR5 | NFR5 | Permission toggles and chips update without noticeable lag locally | |
| T-NFR7 | NFR7 | Layout resembles WhatsApp-style chat (header, bubbles, green accents) | |
| T-NFR9 | NFR9 | Limitation messaging present in composer and co-subject flows | |

---

**Tester:** _______________ **Date:** _______________ **Browser / OS:** _______________
