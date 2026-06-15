<?php

namespace App\Http\Controllers;

use App\Services\AppInstallationTracker;
use App\Support\SchoolProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class SchoolPwaController extends Controller
{
    public function __construct(
        private readonly SchoolProfile $schoolProfile,
        private readonly AppInstallationTracker $tracker,
    ) {}

    public function manifest(Request $request): JsonResponse
    {
        $school = $this->schoolProfile->data();
        $token = $request->string('installation')->toString();
        $startUrl = $token !== '' && $this->tracker->findUsable($token)
            ? route('home', ['installation' => $token], false)
            : route('home', absolute: false);

        return response()->json([
            'name' => "{$school['nameEn']} School App",
            'short_name' => $school['nameEn'],
            'description' => 'School access for students and parents.',
            'id' => '/school-app/',
            'start_url' => $startUrl,
            'scope' => '/',
            'display' => 'standalone',
            'display_override' => ['standalone', 'browser'],
            'background_color' => '#f8fafc',
            'theme_color' => '#0f2f2a',
            'orientation' => 'portrait-primary',
            'categories' => ['education', 'productivity'],
            'icons' => $this->schoolProfile->pwaIcons(),
        ])->header('Content-Type', 'application/manifest+json')->header('Cache-Control', 'no-cache, must-revalidate');
    }

    public function serviceWorker(): Response
    {
        $cachePaths = $this->schoolProfile->pwaCachePaths();
        $icon = $cachePaths[0] ?? '/favicon.ico';
        $precache = json_encode(array_values(array_unique(['/offline', ...$cachePaths])), JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
        $cacheName = 'school-app-v'.md5($precache);
        $script = str_replace(
            ['__CACHE__', '__PRECACHE__', '__ICON__'],
            [$cacheName, $precache, $icon],
            <<<'JS'
const CACHE_NAME = '__CACHE__';
const PRECACHE_URLS = __PRECACHE__;
const OFFLINE_URL = '/offline';
const NOTIFICATION_ICON = '__ICON__';
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin || request.method !== 'GET' || url.pathname.startsWith('/admin') || url.pathname.startsWith('/teacher')) return;
    if (request.mode === 'navigate' && (url.pathname === '/' || url.pathname === '/app' || url.pathname.startsWith('/install/') || url.pathname.startsWith('/student') || url.pathname.startsWith('/parent'))) {
        event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
        return;
    }
    if (url.pathname.startsWith('/build/') || PRECACHE_URLS.includes(url.pathname)) {
        event.respondWith(caches.open(CACHE_NAME).then(async cache => (await cache.match(request)) || fetch(request).then(response => { if (response.ok) cache.put(request, response.clone()); return response; })));
    }
});
self.addEventListener('push', event => event.waitUntil(fetch('/student/push-notifications/latest', { headers: { Accept: 'application/json' }, credentials: 'same-origin' }).then(response => response.ok ? response.json() : null).then(payload => payload?.notification ? self.registration.showNotification(payload.notification.title, { body: payload.notification.body, icon: NOTIFICATION_ICON, badge: NOTIFICATION_ICON, silent: false, tag: payload.notification.tag, data: { url: payload.notification.url } }) : null)));
self.addEventListener('notificationclick', event => { event.notification.close(); const target = event.notification.data?.url || '/student/notifications'; event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => clients[0] ? clients[0].navigate(target).then(() => clients[0].focus()) : self.clients.openWindow(target))); });
JS,
        );

        return response($script, 200, [
            'Content-Type' => 'text/javascript; charset=UTF-8',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Service-Worker-Allowed' => '/',
        ]);
    }

    public function offline(): Response
    {
        return response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>School App Offline</title><style>body{font-family:system-ui;min-height:100vh;display:grid;place-items:center;margin:0;background:#f8fafc;color:#0f172a}main{text-align:center;padding:24px}p{color:#64748b}</style><main><h1>You are offline</h1><p>Reconnect to the internet and reopen the School App.</p></main></html>', 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }
}
