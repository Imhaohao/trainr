# Integration Log

Async coordination channel for the 4 tracks. Append-only; newest at top. Use for: contract-change requests (types/contracts are frozen after Phase 0 — propose here, get a 👍, then make a tiny dedicated commit), "X is ready" announcements, and `BLOCKED:` notes.

## Format
```
### [TIME] [TRACK] <title>
status: ready | blocked | proposal | done
detail: ...
```

## Open items
- [ ] **Request Insforge credentials from user** — `INSFORGE_API_URL`, `INSFORGE_API_KEY`, `INSFORGE_PROJECT_ID`. Until then T1 ships on `LocalRepository`. (owner: T1)

## Log
### [Phase 0] [T1] Foundation in progress
status: in_progress
detail: Authoring types/, lib/contracts/, lib/mocks/, app shell, owner nav (with /compliance + /deploy links pre-seeded for T4), and stubbed §5 routes. Other tracks: wait for the "Phase 0 ready" entry before branching.
