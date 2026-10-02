<?php require_once __DIR__ . '/bootstrap.php'; $v = rawurlencode(APP_VERSION); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="theme-color" content="#1e1548">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Tuqio Gate">
    <meta name="mobile-web-app-capable" content="yes">

    <title>Tuqio Gate</title>

    <link rel="manifest" href="<?= SITE_URL ?>/manifest.json">
    <link rel="apple-touch-icon" href="<?= SITE_URL ?>/icons/icon-192.png">
    <link rel="icon" type="image/png" sizes="192x192" href="<?= SITE_URL ?>/icons/icon-192.png">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?= SITE_URL ?>/css/app.css?v=<?= $v ?>">

    <script>
        // Injected by PHP — no client-side guessing needed
        const API_BASE   = <?= json_encode(GATE_API_BASE) ?>;
        const STORAGE_BASE = <?= json_encode(STORAGE_BASE) ?>;
        const SITE_URL   = <?= json_encode(SITE_URL) ?>;
        const APP_ENV    = <?= json_encode(IS_LOCAL ? 'local' : 'production') ?>;
        const APP_VERSION = <?= json_encode(APP_VERSION) ?>;
        const _isLocal   = <?= IS_LOCAL ? 'true' : 'false' ?>;
    </script>
</head>
<body>
    <div id="app"></div>

    <!-- jsQR — QR code scanner (no npm/build step needed) -->
    <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>

    <script src="<?= SITE_URL ?>/js/toast.js?v=<?= $v ?>"></script>
    <script src="<?= SITE_URL ?>/js/api.js?v=<?= $v ?>"></script>
    <script src="<?= SITE_URL ?>/js/auth.js?v=<?= $v ?>"></script>
    <script src="<?= SITE_URL ?>/js/events.js?v=<?= $v ?>"></script>
    <script src="<?= SITE_URL ?>/js/scanner.js?v=<?= $v ?>"></script>
    <script src="<?= SITE_URL ?>/js/checkin.js?v=<?= $v ?>"></script>
    <script src="<?= SITE_URL ?>/js/pwa.js?v=<?= $v ?>"></script>
    <script src="<?= SITE_URL ?>/js/app.js?v=<?= $v ?>"></script>

    <script>
        if ('serviceWorker' in navigator) {
            // A page that was already controlled is running old code once a new
            // version takes over — offer a reload instead of forcing one mid-scan.
            const hadController = !!navigator.serviceWorker.controller;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!hadController) return;
                toast.info('A new version of Tuqio Gate is ready. <button class="toast-action" id="sw-reload-btn">Reload</button>', 20000);
                document.getElementById('sw-reload-btn')?.addEventListener('click', () => location.reload());
            });

            navigator.serviceWorker.register('<?= SITE_URL ?>/sw.js?v=<?= $v ?>', {
                scope: '<?= SITE_URL ?>/'
            }).catch(() => {});
        }
    </script>
</body>
</html>
