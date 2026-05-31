# Project context (agent memory)

## Decisions

- **Interactive equipment practice** is a graded module gate (like quizzes). Certification requires passing every gate the module defines (`quiz` and/or `simId`). Content ships behind `getEquipmentSim()` — a fixture today, MCP-ready interface documented in `lib/employee/equipment.ts` and `docs/INTEGRATION_LOG.md`.
- Demo sim: `sim_boba_station` on Happy Lemon (`biz_happylemon`), attached to `mod_drink_build`. No numeric recipe measurements in sim copy — station card references only.
- Employee UI strings: `lib/employee/i18n.ts` (en, es, zh-Hans).
