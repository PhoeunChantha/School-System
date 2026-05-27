<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;

class RoleRedirect
{
    public static function defaultPathFor(?User $user): string
    {
        if ($user?->hasRole('student') && ! $user->hasRole('admin')) {
            return route('student.dashboard', absolute: false);
        }

        return route('dashboard', absolute: false);
    }

    public static function intendedOrDefaultPathFor(Request $request): string
    {
        $user = $request->user();
        $intended = $request->session()->pull('url.intended');

        if (is_string($intended) && self::intendedPathIsAllowed($intended, $user)) {
            return $intended;
        }

        return self::defaultPathFor($user);
    }

    private static function intendedPathIsAllowed(string $intended, ?User $user): bool
    {
        $path = parse_url($intended, PHP_URL_PATH) ?: $intended;

        if ($path === '/dashboard') {
            return ! ($user?->hasRole('student') && ! $user->hasRole('admin'));
        }

        if (str_starts_with($path, '/admin')) {
            return ! ($user?->hasRole('student') && ! $user->hasRole('admin'));
        }

        if (str_starts_with($path, '/student')) {
            return $user?->hasRole('student') && ! $user->hasRole('admin');
        }

        return true;
    }
}
