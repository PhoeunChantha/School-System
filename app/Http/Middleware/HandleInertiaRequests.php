<?php

namespace App\Http\Middleware;

use App\Models\HomeworkSubmission;
use App\Models\SchoolSetting;
use App\Services\AppInstallationTracker;
use App\Support\HomeworkSubmissionAlerts;
use App\Support\ParentAccessSettings;
use App\Support\SchoolProfile;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\Log;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        app(AppInstallationTracker::class)->confirmPending($request);

        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar ? asset($user->avatar) : null,
                    'email_verified_at' => $user->email_verified_at,
                    'two_factor_enabled' => $user->two_factor_secret !== null,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ] : null,
                'permissions' => $user?->getAllPermissions()->pluck('name')->values()->all() ?? [],
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'school' => fn (): array => Arr::only(app(SchoolProfile::class)->data(), ['nameEn', 'logo', 'favicon', 'loginBg']),
            'loginSecurity' => function (): array {
                $value = SchoolSetting::query()
                    ->where('group', 'login')
                    ->where('key', 'security')
                    ->value('value') ?? [];

                return [
                    'maxAttempts' => max(1, min(20, (int) Arr::get($value, 'maxAttempts', 5))),
                    'decaySeconds' => max(1, min(3600, (int) Arr::get($value, 'decaySeconds', 15))),
                ];
            },
            'parentAccess' => fn (): array => [
                'enabled' => app(ParentAccessSettings::class)->enabled(),
            ],
            'notificationSound' => function (): ?string {
                $value = SchoolSetting::query()
                    ->where('group', 'notifications')
                    ->where('key', 'preferences')
                    ->value('value') ?? [];

                $path = Arr::get($value, 'notificationSound');

                return filled($path) ? asset((string) $path) : null;
            },
            'homeworkSubmissionAlerts' => function () use ($user): array {
                if (! $user || ! $user->can('view', HomeworkSubmission::class)) {
                    // Log::info('Homework submission alerts shared without permission', [
                    //     'user_id' => $user?->id,
                    //     'partial_data' => $request->header('X-Inertia-Partial-Data'),
                    // ]);

                    return ['unreadCount' => 0, 'latest' => null];
                }

                $alerts = app(HomeworkSubmissionAlerts::class);
                $unreadCount = $alerts->unreadCount($user);
                $latest = $alerts->latestUnread($user);

                // Log::info('Homework submission alerts shared', [
                //     'user_id' => $user->id,
                //     'unread_count' => $unreadCount,
                //     'latest_submission_id' => $latest['id'] ?? null,
                //     'partial_data' => $request->header('X-Inertia-Partial-Data'),
                //     'page_component' => $request->header('X-Inertia-Partial-Component'),
                //     'url' => $request->path(),
                // ]);

                return [
                    'unreadCount' => $unreadCount,
                    'latest' => $latest,
                ];
            },
            'translations' => [
                'admin' => [
                    'en' => Lang::get('admin', [], 'en'),
                    'kh' => Lang::get('admin', [], 'kh'),
                ],
                'student' => [
                    'en' => Lang::get('student', [], 'en'),
                    'kh' => Lang::get('student', [], 'kh'),
                ],
                'parent' => [
                    'en' => Lang::get('parent', [], 'en'),
                    'kh' => Lang::get('parent', [], 'kh'),
                ],
            ],
        ];
    }
}
