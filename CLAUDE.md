# Tuqio Gate — Claude Code Rules

## Project Role
Gate-scanning PWA for event door staff on **Tuqio Hub**: sign in, pick an event, scan ticket QR codes (or type / search guests), check people in. Framework-free PHP + vanilla JavaScript — **no build step, no npm/Composer**. Production: `https://ticketing.tuqiohub.africa`; local: `http://localhost/ticketing-gate`.

## Related Projects
| Project | Role |
|---|---|
| `v1-events-backend/` | Laravel backend ("Tuqio Hub") — source of truth. This app only talks to its `/api/gate/*` routes (`routes/api.php`, `app/Http/Controllers/Api/Gate/GateController.php`). Local: `php artisan serve` on `localhost:8000`. |
| `dfa-ticketing-gate/` | A fork of this app for DFA, talking to `dfa-platform` instead. Same structure — a fix in one usually applies to the other, but roles differ (see **Who can sign in**). |

## Structure
- `index.php` / `bootstrap.php` — the single-page shell. Injects `API_BASE`, `STORAGE_BASE`, `SITE_URL`, `APP_ENV`, `APP_VERSION` as JS globals and loads every JS/CSS file with `?v=APP_VERSION`.
- `config/config.php` — environment detection (local vs production), backend URLs (`TUQIO_HUB_URL` + `TUQIO_HUB_FALLBACK_URL`), `STORAGE_BASE`, `APP_VERSION`.
- `js/` — one module per concern:
  - `api.js` — fetch wrapper, bearer token, 401 → back to login
  - `auth.js` — login/logout, session in `localStorage` (`gate_token`, `gate_user`)
  - `events.js` — event list / detail fetches
  - `scanner.js` — camera + `jsQR` decode loop
  - `checkin.js` — posts ticket codes, renders the result overlay
  - `app.js` — router/renderer for every screen: Login, Events, Dashboard, Scanner, Manual Entry, Check-in Log, Guest Search
  - `pwa.js` — install sheet (iOS steps vs Android/desktop native prompt)
  - `toast.js` — notifications (message is HTML)
- `css/app.css` — the only stylesheet; theme colours are CSS variables at the top of `:root`.
- `sw.js`, `manifest.json`, `icons/` — PWA install + offline shell.
- `.htaccess` — SPA rewrite to `index.php`, blocks `/config`, security headers, 1-week browser cache for JS/CSS.
- `CHANGELOG.md` — one entry per `APP_VERSION`.

## Who can sign in
Decided by the **backend**, not this app: `GateController::login` allows `super_admin`, `client_admin`, `ticket_manager` (v1's role is `ticket_manager` — DFA's is `ticketing_manager`; don't mix them up). Everyone but super admins is scoped to their own `client_id` for events, detail and check-in. No OTP step — v1's web login skips 2FA for these roles too. Backend tests: `tests/Feature/Gate/GateLoginRolesTest.php`.

## Versioning & releases (don't skip)
The service worker serves JS/CSS cache-first, so **installed phones only get new code when `APP_VERSION` changes.**
1. Bump `APP_VERSION` in `config/config.php` (semver: fix → patch, feature → minor).
2. Add a `CHANGELOG.md` entry.
That's all — `index.php` puts the version on every asset URL and registers `sw.js?v=<version>`; `sw.js` names its cache `tuqio-gate-<version>`, fetches with `cache: 'reload'` (bypassing the week-long HTTP cache), deletes old caches, and loads the page itself network-first. Open pages get a "new version ready — Reload" toast; it never reloads on its own mid-scan. A new JS file must also be added to `SHELL_FILES` in `sw.js` (wrapped in `v()`) and to `index.php`.

## Event posters
The API sends `banner_image` as a storage path (`events/{id}/banner_….webp`); `app._posterUrl()` turns it into `STORAGE_BASE/…` (absolute URLs pass through). Posters are square/portrait, so event cards are square and the dashboard banner shows a blurred copy behind the full poster. A missing or broken image falls back to the gradient.

## Local development
- MAMP serves this repo at `http://localhost/ticketing-gate`; the backend must be running at `localhost:8000` (`php artisan serve` in `v1-events-backend`).
- After changing JS/CSS locally, bump `APP_VERSION` or hard-reload — otherwise the service worker keeps serving the old files.
- Check syntax without a build: `node --check js/app.js`, `php -l index.php`.

## Git Workflow
- Branch from `main` before every change — `feature/`, `bugfix/`, `hotfix/`
- Never commit directly to `main`
- One branch per task; commit messages explain **why**
- **Always merge back to `main` when the work is done**

```bash
git checkout main && git pull origin main
git checkout -b feature/your-feature-name
# ... do the work, commit ...
git checkout main
git merge feature/your-feature-name
git push origin main
```
