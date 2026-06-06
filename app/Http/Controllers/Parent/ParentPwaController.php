<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Support\SchoolProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class ParentPwaController extends Controller
{
    public function __construct(private readonly SchoolProfile $schoolProfile) {}

    public function manifest(): JsonResponse
    {
        $school = $this->schoolProfile->data();
        $icons = $this->schoolProfile->pwaIcons();

        return response()
            ->json([
                'name' => "{$school['nameEn']} Parent Portal",
                'short_name' => "{$school['nameEn']} Parent",
                'description' => 'Parent portal for attendance, homework, grades, fees, exams, and school alerts.',
                'id' => '/parent/',
                'start_url' => '/parent/dashboard',
                'scope' => '/parent/',
                'display' => 'standalone',
                'display_override' => ['standalone', 'browser'],
                'background_color' => '#f7f9f5',
                'theme_color' => '#0f2f2a',
                'orientation' => 'portrait-primary',
                'categories' => ['education', 'productivity'],
                'icons' => $icons,
                'shortcuts' => [
                    [
                        'name' => 'Dashboard',
                        'short_name' => 'Home',
                        'url' => '/parent/dashboard',
                    ],
                ],
            ])
            ->header('Content-Type', 'application/manifest+json')
            ->header('Cache-Control', 'no-cache, must-revalidate');
    }

    public function serviceWorker(): Response
    {
        return response($this->serviceWorkerScript($this->schoolProfile->pwaCachePaths()), 200, [
            'Content-Type' => 'text/javascript; charset=UTF-8',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Service-Worker-Allowed' => '/parent/',
        ]);
    }

    public function offline(): Response
    {
        return response(<<<'HTML'
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <meta name="robots" content="noindex,nofollow">
                    <title>Parent Portal Offline</title>
                    <style>
                        :root { color-scheme: light; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
                        body { margin: 0; min-height: 100dvh; display: grid; place-items: center; background: #f7f9f5; color: #0f2f2a; }
                        main { width: min(100% - 40px, 420px); text-align: center; }
                        h1 { margin: 0 0 10px; font-size: 24px; line-height: 1.2; }
                        p { margin: 0; color: #61716b; line-height: 1.6; }
                    </style>
                </head>
                <body>
                    <main>
                        <h1>Parent Portal is offline</h1>
                        <p>Please reconnect to the internet, then reopen the parent portal.</p>
                    </main>
                </body>
            </html>
            HTML, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    /**
     * @param  array<int, string>  $cachePaths
     */
    private function serviceWorkerScript(array $cachePaths): string
    {
        $precacheUrls = json_encode(
            array_values(array_unique([
                '/parent/offline',
                ...$cachePaths,
            ])),
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES,
        );
        $cacheName = 'parent-portal-v'.md5($precacheUrls);

        $script = <<<'JS'
            const CACHE_NAME = '__CACHE_NAME__';
            const OFFLINE_URL = '/parent/offline';
            const PRECACHE_URLS = __PRECACHE_URLS__;

            self.addEventListener('install', (event) => {
                event.waitUntil(
                    caches
                        .open(CACHE_NAME)
                        .then((cache) => cache.addAll(PRECACHE_URLS))
                        .then(() => self.skipWaiting()),
                );
            });

            self.addEventListener('activate', (event) => {
                event.waitUntil(
                    caches
                        .keys()
                        .then((keys) =>
                            Promise.all(
                                keys
                                    .filter((key) => key !== CACHE_NAME)
                                    .map((key) => caches.delete(key)),
                            ),
                        )
                        .then(() => self.clients.claim()),
                );
            });

            self.addEventListener('fetch', (event) => {
                const { request } = event;
                const url = new URL(request.url);

                if (url.origin !== self.location.origin || request.method !== 'GET') {
                    return;
                }

                if (request.mode === 'navigate' && url.pathname.startsWith('/parent')) {
                    event.respondWith(networkFirstParentNavigation(request));

                    return;
                }

                if (url.pathname.startsWith('/build/') || PRECACHE_URLS.includes(url.pathname)) {
                    event.respondWith(staleWhileRevalidate(request));
                }
            });

            async function networkFirstParentNavigation(request) {
                try {
                    return await fetch(request);
                } catch (error) {
                    const cachedOfflinePage = await caches.match(OFFLINE_URL);

                    return cachedOfflinePage || Response.error();
                }
            }

            async function staleWhileRevalidate(request) {
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(request);
                const networkResponsePromise = fetch(request).then((response) => {
                    if (response.ok) {
                        cache.put(request, response.clone());
                    }

                    return response;
                });

                return cachedResponse || networkResponsePromise;
            }
            JS;

        return str_replace(
            ['__CACHE_NAME__', '__PRECACHE_URLS__'],
            [$cacheName, $precacheUrls],
            $script,
        );
    }
}
