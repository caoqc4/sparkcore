# 2026-03-28 Product Console Backend Support Checklist

## 1. Purpose

This document tracks the backend support status for the refactored product console.

For action-level behavior, runtime side effects, and tested flow details, see
[2026-03-29-product-console-backend-actions-runtime-flows.md](/Users/caoq/git/sparkcore/docs/plans/2026-03-29-product-console-backend-actions-runtime-flows.md).

It now serves three purposes:

- record which backend contracts have already been implemented
- show which backend data layers are ready but not yet fully consumed by the frontend pages
- keep a short list of remaining real backend gaps

Scope:

- `Chat`
- `Role`
- `Knowledge`
- `Channels`
- `Settings`
- `Create role`

This document assumes the frontend interaction model is already defined and that backend work should continue to make those product surfaces real.

---

## 2. Status Legend

### `Implemented`

Backend schema / contract / loader / action already exists and is usable now.

### `Backend Ready, Frontend Pending`

Backend support is already in place, but the page is still using simpler or placeholder data and has not fully adopted the richer contract.

### `Integration Tested`

The page or action has been exercised against the current remote Supabase-backed app and has completed successfully in a real logged-in browser session.

### `Still Missing`

Real backend work is still required for the product surface to be complete.

---

## 3. Global Alignment Rules

These still apply across all pages:

- expose stable enums and ids to the frontend, not display labels as source of truth
- keep display-critical timestamps safe and non-broken at both schema and loader layers
- prefer page-level summary fields where frontend repeatedly reconstructs the same status
- do not remove low-level backend capability just because frontend hides internal terminology

---

## 4. Current Backend Status By Surface

## 4.1 Chat

### Implemented

- message payloads now expose origin metadata through the product chat loader:
  - `sourceSurface`
  - `sourcePlatform`
  - `sourceBindingId`
- supplementary chat page data now includes page-ready summaries:
  - `messageSummary`
  - `sourceSummary`
  - `threadStatus`
- `threadStatus` now carries:
  - `connectionStatus`
  - `lifecycleStatus`
  - `continuityStatus`
  - `focusMode`
  - `pendingFollowUpCount`
  - `nextTriggerAt`

### Backend Ready, Frontend Pending

- the chat page can now consume source distribution and thread-state summaries directly, but not all of these richer fields are yet surfaced in the current UI

### Integration Tested

- logged-in chat page opens successfully
- hydration mismatch caused by locale time formatting has been fixed in the current UI
- chat data loads correctly with the current role and thread context

### Still Missing

- none at the core contract level
- future improvements are more about page adoption and UX, not missing backend support

---

## 4.2 Role

### Implemented

- role profile persistence supports:
  - `name`
  - `mode`
  - `tone`
  - `relationship_mode`
  - `boundaries`
  - `proactivity_level`
- role appearance metadata persistence now supports:
  - `avatar_preset_id`
  - `avatar_style`
  - `avatar_gender`
  - `avatar_origin`
- role loaders now expose stored appearance summary:
  - `avatarPresetId`
  - `avatarStyle`
  - `avatarGender`
  - `avatarOrigin`
- role collection loader now includes per-role memory summary:
  - `savedCount`
  - `recentCount`
  - `reviewCount`
- new role page data loader exists for current-role summary use:
  - `loadProductRolePageData(...)`

### Backend Ready, Frontend Pending

- current role switcher and role summary UI can now adopt:
  - appearance summary
  - per-role memory summary
- current role page can adopt the dedicated role page loader instead of continuing to assemble summary state from multiple loaders

### Integration Tested

- role page loads successfully with real role data
- memory dates no longer surface broken `Invalid Date` values after backend timestamp normalization and repair

### Still Missing

- no critical backend gaps remain for the current Role design
- future work here is more about page integration and summary cleanup

---

## 4.3 Memory

### Implemented

- memory category contract has been expanded to support product-facing categories:
  - `profile`
  - `preference`
  - `relationship`
  - `goal`
  - `episode`
  - `mood`
  - `key_date`
  - `social`
- backend write path now routes new memory types correctly instead of collapsing them into legacy shapes
- recall-side handling has been aligned so new categories do not get reclassified incorrectly
- product memory loader now normalizes broken or missing timestamps before data reaches the page
- migration repair has been added for legacy timestamp drift:
  - `threads`
  - `messages`
  - `memory_items`

### Backend Ready, Frontend Pending

- memory UI can trust richer category semantics and safer timestamps
- some page-level phrasing and grouping may still not fully reflect the new category model

### Integration Tested

- repaired timestamp path has been validated through the role/memory surface
- legacy broken timestamp output is no longer visible in the current tested role

### Still Missing

- no core backend contract gap remains for current memory grouping
- deeper work later would be about data quality refinement, not missing product-console support

---

## 4.4 Knowledge

### Implemented

- real `knowledge_sources` schema now exists
- knowledge source lifecycle is implemented:
  - create
  - upload
  - process
  - retry
  - archive
  - delete
- knowledge processing pipeline exists for:
  - `note`
  - `url`
  - text-like documents
  - `csv`
  - `xlsx`
  - `docx`
  - `pdf`
- storage bucket migration exists for `knowledge-sources`
- knowledge processing observability now exists:
  - attempt count
  - start time
  - processed time
  - last error code
  - processing runs table
- knowledge loader now exposes richer per-source state:
  - `processingStatus`
  - `attemptCount`
  - `lastProcessingStartedAt`
  - `lastProcessedAt`
  - `lastErrorCode`
  - `errorMessage`
  - `latestRun`
  - `canRetry`
  - `canArchive`
  - `canDelete`

### Backend Ready, Frontend Pending

### Integration Tested

- note source creation succeeds
- URL source creation succeeds
- text document upload succeeds
- archive succeeds
- delete succeeds
- stuck processing sources are now surfaced as retryable failures in the current page model
- retry succeeds for previously stuck sources after backend retry semantics were expanded

### Still Missing

- no core lifecycle gap remains
- future improvements would be about higher-quality parsing or richer retrieval behavior, not missing base backend support

---

## 4.5 Channels

### Implemented

- `channel_platform_capabilities` schema now exists
- platform capability loader exists with safe defaults for:
  - `Telegram`
  - `WeChat`
  - `Discord`
- channel binding status model now supports:
  - `active`
  - `inactive`
  - `invalid`
- product channel summary now distinguishes:
  - `connected`
  - `needs_attention`
  - `web_only`
- reusable binding status update helper exists:
  - `updateOwnedChannelBindingStatus(...)`
- invalidation now closes the loop from runtime behavior:
  - proactive Telegram send failure can mark a binding `invalid`
  - webhook outbound delivery failure can mark a binding `invalid`
- channels page loader now exposes platform-ready rows:
  - `platforms`
  - per-platform `displayStatus`
  - per-platform `actionMode`
  - active / inactive / invalid counts
  - `supportsAdvancedIdentityFields`

### Backend Ready, Frontend Pending

- channels UI can now move from static platform assumptions to backend-driven capability and status rendering

### Integration Tested

- `Connect Telegram` flow succeeds with test binding values
- disconnect succeeds and returns the page to `web_only`
- transient Supabase fetch failures now degrade instead of taking the page down

### Still Missing

- no core contract gap remains for the current Channels design
- future work is mainly richer frontend adoption and health UX

---

## 4.6 Settings

### Implemented

- settings schema now exists for:
  - app settings
  - subscription snapshots
- settings actions now support:
  - app preferences save
  - model settings save
  - data/privacy save
  - subscription snapshot save
  - export data
  - sign out all sessions
  - delete account
- data export schema and payload builder now exist
- delete-account audit table exists
- unified settings operation log table exists
- settings loader now exposes:
  - `account`
  - `appSettings`
  - `subscription`
  - `latestExport`
  - `recentOperations`
  - `capabilities`

### Backend Ready, Frontend Pending

### Integration Tested

- `Save preferences` succeeds
- `Save model settings` succeeds
- `Save subscription` succeeds
- `Save privacy settings` succeeds
- `Export my data` succeeds
- high-risk actions were intentionally not executed:
  - `Sign out all`
  - `Delete account`

### Still Missing

- no critical backend action gap remains for the current Settings design
- future improvements are primarily page integration and richer operational UX

---

## 4.7 Create Role

### Implemented

- create flow now persists appearance metadata so the look-selection step is semantically real even before upload is fully supported
- backend now stores:
  - `avatar_preset_id`
  - inferred `avatar_style`
  - `avatar_gender`
  - `avatar_origin`

### Backend Ready, Frontend Pending

- appearance metadata is now real data, even where the create flow still visually presents some future-facing options

### Integration Tested

- create flow semantics are now backed by persisted appearance metadata
- the full uploaded-avatar pipeline is still intentionally untested because media upload remains incomplete

### Still Missing

- image upload remains intentionally incomplete as a full media pipeline
- if step-2 `traits` are meant to be true saved data rather than onboarding guidance, a final persistence decision is still needed:
  - recommended shape: `personality_traits: string[]`

---

## 5. Remaining Real Backend Gaps

These are the backend items that still count as genuine product-console gaps rather than page adoption work.

### 5.1 Create Role Traits Persistence Decision

Still unresolved:

- are step-2 trait chips real persisted role data, or only onboarding guidance?

If persisted, backend should add:

- `personality_traits: string[]`

### 5.2 Full Uploaded Avatar Asset Pipeline

Current metadata support is enough for now, but full upload support would still need:

- `avatar_asset_id`
- `avatar_url`
- storage / media linkage

### 5.3 Deeper Knowledge Parsing Quality

The pipeline exists, but future quality work may still be needed for:

- better PDF parsing quality
- richer DOCX/XLSX extraction fidelity
- more advanced indexing or retrieval semantics

These are not blocking the current console architecture.

---

## 6. Recommended Next Integration Order

If the goal is to move from backend readiness into real product behavior, the next order should be:

### Phase 1: Finish High-Risk or Deferred Validation

- decide whether to explicitly test:
  - `Sign out all`
  - `Delete account`
- if these are not executed in shared environments, document them as audit-backed but intentionally unverified destructive actions

### Phase 2: Finish Remaining True Gaps

- decide and implement create-step traits persistence
- optionally extend avatar upload to full media support

### Phase 3: Depth and Quality

- deeper knowledge parsing quality
- richer frontend operational views on top of already-supported backend data

---

## 7. Most Important Short Version

Backend support for the new product console is now largely in place.

The current state is:

1. `Chat`, `Role`, `Memory`, `Knowledge`, `Channels`, `Settings`, and `Create` all have real backend support layers
2. the main non-destructive product actions have now been integration-tested successfully
3. the biggest remaining backend questions are:
   - whether create-step personality traits should be persisted
   - whether to execute or continue deferring high-risk destructive settings actions in shared environments

So the project is no longer in “backend missing major product contracts” mode.

It is now in “backend largely complete, integration-tested for main safe flows, with only a small set of deferred or optional follow-ups” mode.
