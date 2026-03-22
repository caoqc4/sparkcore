# `@sparkcore/integrations-im-adapter` boundary

This package is the first extraction point for the Phase 1 integration layer.

Current scope:
- inbound channel message contract
- outbound channel message contract
- binding and identity shapes
- binding repository seam and future persistence mapping shell
- runtime port interface for adapter-to-runtime handoff
- pure bridge helpers for `incoming -> runtime -> outgoing`

Not allowed in this package at this stage:
- concrete IM platform SDK clients
- webhook servers or polling loops
- memory strategy logic
- runtime orchestration internals
- product onboarding or UI workflows

Recommended file roles:
- `contract.ts`: channel, binding, runtime port, and bridge result types
- `repository.ts`: repository seam and in-memory repository stub
- `supabase-repository.ts`: future persistence mapping shell for a real binding table
- `bridge.ts`: pure mapping helpers and minimal adapter flow
- `index.ts`: minimal export surface
- `example.ts`: minimal end-to-end skeleton usage

This package intentionally stops at the integration boundary. It does not own
platform-specific delivery code, scheduler execution, or database persistence yet.
