# 2026-03-27 Product Layer Route + Style Refactor Design

## Scope

### In scope
- Route consistency for role-context navigation across:
  - `/app/[roleId]`
  - `/app/chat`
  - `/app/memory`
  - `/app/settings`
- Console nav active-state fix so `/app/{roleId}` correctly highlights Console Home.
- Starterkit-style token bridge (semantic alias layer) in existing global CSS.
- Shell-first visual alignment, then incremental page-level alignment.

### Out of scope
- Business data model changes (`threads`, `agents`, `memories` schema).
- Rewriting existing dashboard/business loaders beyond correctness fixes.
- New product features unrelated to route/style closure.

---

## 1) Starterkit token extraction strategy

Reference source: `/Users/caoq/git/sistine-starter-vibe-to-production`

Extract **semantic tokens** (not raw hardcoded colors) into six buckets:

1. Color foundation
- `--background`, `--foreground`
- `--card`, `--popover`
- `--muted`, `--muted-foreground`

2. Interactive semantics
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--accent`, `--accent-foreground`

3. Form + boundary
- `--border`, `--input`, `--ring`

4. Component/chrome
- `--navbar-bg`, `--navbar-bg-scrolled`, `--hover-bg`

5. Radius + elevation
- radius scale (`--radius` + derived sizes)
- shadow color + named shadows (`navbar`, `card`, etc.)

6. Typography + hierarchy
- display vs body font pairing
- heading/body sizing rhythm
- surface hierarchy rules (sidebar/card/hero/content)

Extraction output should be a **mapping table** from starterkit semantic tokens to SparkCore current tokens (`--bg`, `--text`, `--panel`, `--panel-border`, `--accent`, etc.) so migration can be incremental.

---

## 2) Minimal-intrusion migration order

### Phase A — correctness first (route)
1. Fix role propagation in `/app/[roleId]` and `/app/chat` links.
2. Fix console active matcher for `/app/{roleId}`.
3. Fix dashboard recent preview logic to read latest user/assistant messages.

### Phase B — token bridge
1. Add semantic alias tokens in `apps/web/app/globals.css`.
2. Keep old token names intact; only map/bridge, avoid deleting existing variables.

### Phase C — shell-first visual alignment
1. Update `product-console-shell` and shell-related styles in `marketing-refresh.css`.
2. Standardize nav active, card hierarchy, topbar, chips, pills.

### Phase D — page-by-page alignment
Order:
1. `/app/[roleId]`
2. `/app/roles`
3. `/app/chat`
4. `/app/memory`
5. `/app/settings`

Each page should focus on spacing, button/pill consistency, and card hierarchy; avoid changing data flow.

---

## 3) Priority files

### Highest priority
- `apps/web/components/product-console-shell.tsx`
- `apps/web/app/app/[roleId]/page.tsx`
- `apps/web/app/app/chat/page.tsx`
- `apps/web/lib/product/dashboard.ts`

### Token + style bridge
- `apps/web/app/globals.css`
- `apps/web/app/marketing-refresh.css`

### Follow-up pages
- `apps/web/app/app/memory/page.tsx`
- `apps/web/app/app/settings/page.tsx`
- `apps/web/app/app/roles/page.tsx`

---

## 4) Acceptance criteria

### Route behavior
- From `/app/{roleId}`, jumps to chat/memory/settings preserve the same `role`.
- `/app/chat` internal links to settings/channels preserve role.
- Console Home nav item is active on `/app/{roleId}`.
- No accidental fallback to “recent role” during in-console navigation.

### Data correctness
- Dashboard recent user/assistant previews use latest matching messages, not earliest.

### Style consistency
- Shell visual hierarchy aligns with starterkit semantic structure.
- App pages share consistent card/button/pill rhythm and spacing.
- No major layout regressions in settings tabs or memory lists.

---

## 5) Rollback strategy (commit slicing)

Recommended commit slices:

1. **Commit A**: route consistency + dashboard correctness
2. **Commit B**: token bridge only (`globals.css`/token aliases)
3. **Commit C**: shell visual refactor
4. **Commit D**: per-page visual adjustments

Rollback policy:
- If visual regressions occur, rollback D then C first.
- Keep A (route fixes) and B (token foundation) unless they are proven faulty.

---

## 6) Verification checklist

1. Navigate manually:
- `/app`
- `/app/{roleId}`
- `/app/chat?role=...`
- `/app/memory?role=...`
- `/app/settings?role=...`
- `/app/roles`

2. Verify link propagation:
- All in-console links preserve role context where expected.

3. Verify activity correctness:
- Recent user/assistant preview reflects latest turns.

4. Verify event continuity:
- Existing product events still fire (`first_dashboard_view`, `first_memory_view`, `first_supplementary_chat_view`, `settings_console_view`, memory action events).

---

## 7) Progress snapshot (2026-03-27)

### Completed
- Route closure in key surfaces:
  - `/app/[roleId]` now carries explicit `role` context into in-console jump links for chat, memory, and settings.
  - Shared console navigation now preserves the active role context instead of silently falling back to the most recent role during sidebar navigation.
  - `/app` now resolves to the recent role console (`/app/{roleId}`) when a role exists, instead of acting like a terminal surface.
  - `/app/chat` now consistently builds role-aware settings/channels/memory links from resolved role context.
  - `/app/memory` now resolves role-aware settings/chat/app-home links from explicit or resolved role context.
  - `/app/settings` now resolves role-aware chat/memory/channel links from explicit or resolved role context.
  - `/app/roles` “Back to console” now prefers the active/recent role console (`/app/{roleId}`) and only falls back to `/app` when no role exists.
  - Console Home active-state now correctly matches `/app/{roleId}` instead of only `/app`.
- Dashboard recent activity correctness is aligned to latest user/assistant turns (reverse-find latest match strategy).
- Token bridge landed in CSS foundation:
  - `apps/web/app/globals.css`
  - `apps/web/app/marketing-refresh.css`
  - semantic aliases added for background/foreground/card/popover/interactive/border/ring/radius/shadow layers while preserving legacy SparkCore tokens.
- Shell-first style alignment landed for:
  - console shell container and sidebar hierarchy,
  - nav links (default/hover/active),
  - status pills,
  - settings tab controls.
- Core product events remain wired in the updated surfaces:
  - `first_dashboard_view`
  - `role_assets_view`
  - `first_supplementary_chat_view`
  - `first_memory_view`
  - `settings_console_view`
  - memory action events.
- `apps/web` typecheck passes after the route/shell updates (`npm run typecheck`).

### In progress
- Phase D page-level visual rhythm polish across:
  - `/app/[roleId]`, `/app/roles`, `/app/chat`, `/app/memory`, `/app/settings`
  - scope limited to spacing/card/button/pill consistency, no data-flow changes.
- Visual alignment is present at the shell/card hierarchy layer, but several pages still read as incremental polish rather than obvious redesign. This is expected given the current low-intrusion scope.

### Remaining verification
- Manual route sweep:
  - `/app`, `/app/{roleId}`, `/app/chat?role=...`, `/app/memory?role=...`, `/app/settings?role=...`, `/app/roles`.
- Confirm in-console links do not drop role context when navigating via:
  - sidebar nav,
  - top-level CTA buttons,
  - page-local jump links.
- Confirm event continuity still fires:
  - `first_dashboard_view`, `role_assets_view`, `first_supplementary_chat_view`, `first_memory_view`, `settings_console_view`, memory action events.
- Quick visual regression pass for settings tabs and memory list surfaces.
- Optional follow-up: add smoke coverage for role-context propagation so future shell refactors cannot silently regress this behavior.
