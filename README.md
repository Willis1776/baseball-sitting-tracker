# Sit Chart: Baseball Sitting Tracker

A mobile-first web app for youth baseball coaches to track **who sits each inning** and keep playing time fair across every game, league and tournament. It replaces a Google Sheets sitting chart with something built for a phone in the dugout.

## Features

- **Multiple teams** per coach, each with its own roster, season label and default innings per game.
- **Roster management**: add, edit, reorder and remove players. Mark players **active/inactive**: active players are copied into each *new* game's lineup, while inactive players keep all of their totals.
- **Per-game lineups**: every game snapshots the active roster when it is created. Changing the roster later never alters existing games. Each game's lineup can be adjusted on its own (late arrivals, absences).
- **Leagues & tournaments**: group games, add existing standalone games to them, or remove games from them. Games can also stand alone.
- **Tap-to-sit chart**: tap a player/inning cell to mark them sitting. Updates are optimistic and saved instantly. Six innings show by default; add extra innings (up to 9) and swipe sideways to see them.
- **Running totals** on every game: this game, the league/tournament total *through this game*, and the season total. Players who sat the most and least are highlighted, and a "fewest sits first" sort helps decide who sits next.
- **Totals reports** for each league/tournament and for the whole season, with running-total and per-game views.
- **Shared teams**: the owner can add other coaches by email. Coaches can manage everything except deleting the team or changing who has access.
- **Invite-only sign-in**: Google SSO or email + password, only for people the super admin has added (or who were invited to a team).
- **Admin panel** (Filament) at `/admin` for managing users, teams, rosters, leagues and games.
- **Installable** to a phone's home screen (web app manifest).

## Tech stack

- [Laravel 13](https://laravel.com) (PHP 8.3+)
- [Filament 5](https://filamentphp.com) admin panel
- [Inertia.js 3](https://inertiajs.com) + [React 19](https://react.dev) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com), [Vite](https://vite.dev)
- [Laravel Socialite](https://laravel.com/docs/socialite) for Google sign-in
- SQLite by default (any Laravel-supported database works)

## Requirements

- PHP 8.3+ with the `sqlite3` (or your database's) extension
- Composer 2
- Node.js 20.19+ (22 recommended) and npm

## Getting started

```bash
git clone https://github.com/Willis1776/baseball-sitting-tracker.git
cd baseball-sitting-tracker

composer install
npm install

cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate

npm run build        # or `npm run dev` while developing
php artisan serve
```

Then open http://localhost:8000.

### Local development without Google

Set `DEV_LOGIN=true` in `.env` (honored only when `APP_ENV=local`) to show a **Local dev sign-in** link on the login page. Seed demo data that mirrors the original spreadsheet with:

```bash
php artisan db:seed
```

## Configuration

### Super admin

`SUPER_ADMIN_EMAIL` (default `willis@clarity-hd.com`) is the one permanent super admin. That account:

- can always sign in with Google, even before any users exist;
- always has access to the admin panel and cannot be demoted or deleted;
- is the only account that can grant or revoke admin access for other users.

To create or recover a password login from the command line (useful before Google is configured):

```bash
php artisan app:set-password willis@clarity-hd.com
```

### Adding users

Sign in to `/admin` → **Users** → **New user**. Enter a name and email. Optionally set a password for email + password sign-in, then share it with them. They can change it from the account menu. A user added this way can also sign in with Google if their email is a Google account.

Team owners can also add coaches by email from **Team settings → Coaches**. Those people may sign in with Google even if no user record exists yet.

### Google sign-in

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth client ID** of type *Web application*.
2. Add an authorized redirect URI: `https://your-domain.com/auth/google/callback` (and `http://localhost:8000/auth/google/callback` for local use).
3. Put the credentials in `.env`:

```dotenv
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI="${APP_URL}/auth/google/callback"
```

## Running tests

```bash
php artisan test
npx tsc --noEmit   # type-check the React frontend
```

## Deploying

Standard Laravel deployment applies (Laravel Cloud, Forge, Vapor or any PHP host):

```bash
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan migrate --force
php artisan optimize
```

Set `APP_ENV=production`, `APP_DEBUG=false`, `DEV_LOGIN=false`, a production `APP_URL`, and your Google credentials. Serve over HTTPS so phones can install the app to the home screen.

## How totals are counted

- A **sit** is one player sitting out one inning of one game.
- **Gm**: innings the player sits in the current game.
- **Lg / Trn**: the player's league or tournament total through the current game, in date/time order. Later games are not included.
- **Ssn**: the player's total across every game on the team.

## License

Copyright © 2026 Michael Willis.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. See [LICENSE](LICENSE) for the full text.
