# Changelog

Bump `APP_VERSION` in `config/config.php` on every release — it versions the
JS/CSS URLs and the service-worker cache, which is what makes installed phones
pick up new code (they get a "new version ready — Reload" toast).

## 1.2.0 — 2026-10-02
- Event posters on the event cards (now square) and the dashboard banner.

## 1.1.0 — 2026-10-02
- Ticket managers can sign in (backend: v1-events-backend `GateController::login`). They only see their own client's events.
- Show/hide toggle on the login password field.
- Install sheet no longer cuts off its bottom button on short screens; proper iOS share icon.
- Release versioning: one `APP_VERSION` drives asset URLs and the service-worker cache; page loads network-first; update prompt when a new version takes over.
- App version shown on the events screen.

## 1.0.0
- Initial Tuqio Gate PWA.
