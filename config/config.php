<?php
ob_start();

// ─── Environment detection ─────────────────────────────────────────────────
$_host   = $_SERVER['HTTP_HOST'] ?? '';
$isLocal = str_contains($_host, 'localhost') || str_contains($_host, '127.0.0.1');

define('IS_LOCAL', $isLocal);

// ─── Site URL ──────────────────────────────────────────────────────────────
define('SITE_URL', $isLocal
    ? 'http://localhost/ticketing-gate'
    : 'https://ticketing.tuqiohub.africa');

// ─── Tuqio Hub API (v1-events-backend) ────────────────────────────────────
define('TUQIO_HUB_URL', $isLocal
    ? 'http://localhost:8000'
    : 'https://platform.tuqiohub.africa');

define('GATE_API_BASE', TUQIO_HUB_URL . '/api/gate');

define('APP_VERSION', '1.0.0');

// ─── Authenticated Gate API helper (server-side calls if ever needed) ──────
function gate_api(string $path, string $token, string $method = 'GET', array $data = []): array {
    $ch = curl_init(GATE_API_BASE . $path);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_HTTPHEADER     => [
            'Accept: application/json',
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token,
        ],
    ];
    if ($method === 'POST') {
        $opts[CURLOPT_POST]       = true;
        $opts[CURLOPT_POSTFIELDS] = json_encode($data);
    }
    curl_setopt_array($ch, $opts);
    $body = curl_exec($ch);
    curl_close($ch);
    return json_decode($body ?: '{}', true) ?? [];
}
