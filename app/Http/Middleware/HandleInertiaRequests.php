<?php

namespace App\Http\Middleware;

use App\Models\SchoolSetting;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
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
            'school' => function (): array {
                $value = SchoolSetting::query()
                    ->where('group', 'school')
                    ->where('key', 'profile')
                    ->value('value') ?? [];

                return [
                    'nameEn'  => $value['nameEn'] ?? 'Frania English School',
                    'logo'    => ! empty($value['logo']) ? asset($value['logo']) : null,
                    'favicon' => ! empty($value['favicon']) ? asset($value['favicon']) : null,
                    'loginBg' => ! empty($value['loginBg']) ? asset($value['loginBg']) : null,
                ];
            },
        ];
    }
}
