<?php

namespace App\Services;

use App\Models\AppInstallationLink;
use App\Models\Student;
use App\Support\ParentAccessSettings;
use Illuminate\Http\Request;

class AppInstallationTracker
{
    public function __construct(private readonly ParentAccessSettings $parentAccessSettings) {}

    public function findUsable(string $token): ?AppInstallationLink
    {
        $link = AppInstallationLink::query()
            ->with('student')
            ->where('token_hash', hash('sha256', $token))
            ->first();

        return $link?->isUsable() ? $link : null;
    }

    /** @param array<string, mixed> $metadata */
    public function record(AppInstallationLink $link, string $event, Request $request, array $metadata = []): void
    {
        $link->events()->create([
            'event' => $event,
            'metadata' => $metadata,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $attributes = [
            'platform' => $metadata['platform'] ?? $link->platform ?? $this->platform($request->userAgent()),
            'browser' => $metadata['browser'] ?? $link->browser ?? $this->browser($request->userAgent()),
            'user_agent' => $request->userAgent(),
        ];

        if ($event === 'opened') {
            $attributes['opened_at'] = $link->opened_at ?? now();
            $attributes['last_opened_at'] = now();
        } elseif ($event === 'install_started' || $event === 'appinstalled') {
            $attributes['install_started_at'] = $link->install_started_at ?? now();
        } elseif ($event === 'app_opened') {
            $attributes['app_opened_at'] = $link->app_opened_at ?? now();
            $attributes['last_opened_at'] = now();
        } elseif ($event === 'confirmed') {
            $attributes['confirmed_at'] = $link->confirmed_at ?? now();
        }

        $link->update($attributes);
    }

    public function remember(Request $request, AppInstallationLink $link): void
    {
        $request->session()->put('app_installation_token_hash', $link->token_hash);
    }

    public function confirmPending(Request $request): void
    {
        $tokenHash = $request->session()->get('app_installation_token_hash');

        if (! is_string($tokenHash) || $tokenHash === '') {
            return;
        }

        $link = AppInstallationLink::query()->with('student')->where('token_hash', $tokenHash)->first();

        if (! $link?->isUsable() || $link->confirmed_at !== null || ! $this->identityMatches($request, $link)) {
            return;
        }

        $this->record($link, 'confirmed', $request);
    }

    private function identityMatches(Request $request, AppInstallationLink $link): bool
    {
        if ($link->audience === 'student') {
            $student = $request->user()
                ? Student::query()->where('user_id', $request->user()->id)->first()
                : null;

            return $student?->is($link->student) ?? false;
        }

        $parentPhone = $request->session()->get('parent_access_phone');

        return is_string($parentPhone)
            && $this->parentAccessSettings->normalizePhone($parentPhone)
                === $this->parentAccessSettings->normalizePhone((string) $link->student->parent_phone);
    }

    private function platform(?string $userAgent): string
    {
        $userAgent ??= '';

        return match (true) {
            str_contains($userAgent, 'Android') => 'Android',
            str_contains($userAgent, 'iPhone'), str_contains($userAgent, 'iPad') => 'iOS',
            str_contains($userAgent, 'Windows') => 'Windows',
            str_contains($userAgent, 'Macintosh') => 'macOS',
            default => 'Unknown',
        };
    }

    private function browser(?string $userAgent): string
    {
        $userAgent ??= '';

        return match (true) {
            str_contains($userAgent, 'Edg/') => 'Edge',
            str_contains($userAgent, 'CriOS'), str_contains($userAgent, 'Chrome/') => 'Chrome',
            str_contains($userAgent, 'FxiOS'), str_contains($userAgent, 'Firefox/') => 'Firefox',
            str_contains($userAgent, 'Safari/') => 'Safari',
            default => 'Unknown',
        };
    }
}
