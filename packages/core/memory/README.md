# `@sparkcore/core-memory` boundary

This package is the first extraction point for the Phase 1 memory layer.

Current scope:
- memory contract types
- knowledge contracts
- scenario memory pack contracts
- memory request and response shapes
- memory compatibility helpers for legacy `memory_items` records
- pure schema-normalization helpers with no runtime or product coupling

Not allowed in this package at this stage:
- page or UI logic
- runtime turn orchestration
- IM adapter fields or platform-specific payloads
- product workflow fields
- temporary app-only helpers

Recommended file roles:
- `contract.ts`: types, interfaces, schema helpers, request/response definitions
- `index.ts`: minimal export surface
- `example.ts`: minimal usage examples for future runtime consumption

This package intentionally does not host recall pipelines, write-path orchestration,
repositories, or storage adapters yet. Those will be added only after the contract
surface stays stable.
