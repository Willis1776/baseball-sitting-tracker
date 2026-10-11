# Project notes for coding agents

Sit Chart is a Laravel 13 + Filament 5 + Inertia 3/React 19 (TypeScript, Tailwind 4) app for tracking which baseball players sit each inning.

## Layout

- `app/Models`: `Team` (owner + `members`), `Player`, `Competition` (league | tournament), `Game` (`lineup` pivot snapshot, `sits`), `Sit` (one player × one inning × one game), `TeamMember` (coach invite by email).
- `app/Policies/TeamPolicy.php`: `manage` (owner or coach) and `administer` (owner only). Every nested route uses `scopeBindings()` under `teams/{team}`.
- `app/Services/SittingTotals.php`: sit-count matrices and players × games reports with running totals.
- `resources/js/Pages`: Inertia pages (`Teams/Show` holds the tabbed team dashboard, `Games/Show` the tap-to-sit chart).
- `app/Filament`: admin panel resources. Only `is_admin` users and the super admin (`config('sitting.super_admin_email')`) can access it.

## Rules worth keeping

- A game's lineup is snapshotted from the active roster in `Game::booted()`. Roster active toggles must never modify existing lineups.
- Sign-in is invite-only (super admin, admin-added users, invited coaches).
- Games are capped at `Game::MAX_INNINGS` (9). Six innings must fit on a 375px-wide phone without horizontal scrolling.
- Mobile-first: test UI at 375px wide.

## Commands

- `php artisan test`: feature tests (SQLite in memory)
- `npx tsc --noEmit`: type-check the frontend (use Node 22)
- `npm run build` / `npm run dev`
