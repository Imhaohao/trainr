# Trainr — agent notes

## UI components (shadcn)

This repo uses **shadcn/ui** components installed into the codebase (not a separate component library import).

When you need a UI primitive:

1. **Reuse first** — check `@/components/ui` and import from `@/components/ui` (see `components/ui/index.ts`).
2. **Add via shadcn CLI** — if a component is missing, install it with the project config instead of hand-writing a custom one:

   ```bash
   npx shadcn@latest add <component-name>
   ```

   Config lives in `components.json` (`style: radix-rhea`, aliases point at `@/components/ui` and `@/lib/utils`).

3. **Keep changes additive** — one component per file under `components/ui/`. Export new components from `components/ui/index.ts`. Do not reorganize or rewrite existing shadcn files unless fixing a bug.
4. **Match conventions** — use the downloaded shadcn patterns (`cn` from `@/lib/utils`, Radix primitives, CVA variants). Do not substitute ad-hoc HTML/CSS buttons, inputs, or dialogs when a shadcn component exists or can be added.
