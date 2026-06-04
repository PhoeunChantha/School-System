<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Support\SchoolProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class StudentPwaController extends Controller
{
    public function __construct(private readonly SchoolProfile $schoolProfile) {}

    public function manifest(): JsonResponse
    {
        $school = $this->schoolProfile->data();
        $icons = $this->schoolProfile->pwaIcons();

        return response()
            ->json([
                'name' => "{$school['nameEn']} Student Portal",
                'short_name' => $school['nameEn'],
                'description' => 'Student portal for grades, attendance, homework, and school notifications.',
                'id' => '/student/',
                'start_url' => '/student/dashboard',
                'scope' => '/',
                'display' => 'standalone',
                'display_override' => ['standalone', 'browser'],
                'background_color' => '#f8fafc',
                'theme_color' => '#009c7f',
                'orientation' => 'portrait-primary',
                'categories' => ['education', 'productivity'],
                'icons' => $icons,
                'shortcuts' => [
                    [
                        'name' => 'Dashboard',
                        'short_name' => 'Home',
                        'url' => '/student/dashboard',
                    ],
                    [
                        'name' => 'Notifications',
                        'short_name' => 'Alerts',
                        'url' => '/student/notifications',
                    ],
                    [
                        'name' => 'Homework',
                        'short_name' => 'Homework',
                        'url' => '/student/homework',
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
            'Service-Worker-Allowed' => '/',
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
                    <title>Student Portal Offline</title>
                    <style>
                        :root { color-scheme: light; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
                        body { margin: 0; min-height: 100dvh; display: grid; place-items: center; background: #f8fafc; color: #0f172a; }
                        main { width: min(100% - 40px, 420px); text-align: center; }
                        h1 { margin: 0 0 10px; font-size: 24px; line-height: 1.2; }
                        p { margin: 0; color: #64748b; line-height: 1.6; }
                    </style>
                </head>
                <body>
                    <main>
                        <h1>Student Portal is offline</h1>
                        <p>Please reconnect to the internet, then reopen the student portal.</p>
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
        $notificationIcon = $cachePaths[0] ?? '/favicon.ico';
        $precacheUrls = json_encode(
            array_values(array_unique([
                '/student/offline',
                ...$cachePaths,
            ])),
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES,
        );
        $cacheName = 'student-portal-v'.md5($precacheUrls);

        $script = <<<'JS'
            const CACHE_NAME = '__CACHE_NAME__';
            const OFFLINE_URL = '/student/offline';
            const NOTIFICATION_ICON = '__NOTIFICATION_ICON__';
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

                if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/teacher')) {
                    return;
                }

                if (request.mode === 'navigate' && (url.pathname.startsWith('/student') || url.pathname === '/login')) {
                    event.respondWith(networkFirstStudentNavigation(request));

                    return;
                }

                if (isPublicStaticAsset(url)) {
                    event.respondWith(staleWhileRevalidate(request));
                }
            });

            self.addEventListener('push', (event) => {
                event.waitUntil(showLatestStudentNotification());
            });

            self.addEventListener('notificationclick', (event) => {
                event.notification.close();

                const targetUrl = event.notification.data?.url || '/student/notifications';

                event.waitUntil(
                    self.clients
                        .matchAll({ type: 'window', includeUncontrolled: true })
                        .then((clients) => {
                            const visibleClient = clients.find((client) => 'focus' in client);

                            if (visibleClient) {
                                visibleClient.navigate(targetUrl);

                                return visibleClient.focus();
                            }

                            return self.clients.openWindow(targetUrl);
                        }),
                );
            });

            async function networkFirstStudentNavigation(request) {
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

            function isPublicStaticAsset(url) {
                return (
                    url.pathname.startsWith('/build/') ||
                    PRECACHE_URLS.includes(url.pathname)
                );
            }

            async function showLatestStudentNotification() {
                const response = await fetch('/student/push-notifications/latest', {
                    headers: {
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                });

                if (!response.ok) {
                    return;
                }

                const payload = await response.json();
                const notification = payload.notification;

                if (!notification) {
                    return;
                }

                await self.registration.showNotification(notification.title, {
                    body: notification.body,
                    icon: NOTIFICATION_ICON,
                    badge: NOTIFICATION_ICON,
                    silent: false,
                    tag: notification.tag,
                    data: {
                        url: notification.url,
                    },
                });
            }
            JS;

        return str_replace(
            ['__CACHE_NAME__', '__NOTIFICATION_ICON__', '__PRECACHE_URLS__'],
            [$cacheName, $notificationIcon, $precacheUrls],
            $script,
        );
    }
}
