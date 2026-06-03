<?php

namespace App\Listeners;

use App\Mail\LoginLockoutAlert;
use App\Models\SchoolSetting;
use App\Services\Backends\SchoolSettingService;
use App\Support\ConfigurableLoginRateLimiter;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Laravel\Fortify\Fortify;
use Throwable;

class SendLoginLockoutAlert
{
    public function __construct(private readonly ConfigurableLoginRateLimiter $limiter) {}

    public function handle(Lockout $event): void
    {
        $settings = $this->settings();

        if (! (bool) ($settings['alertEnabled'] ?? true)) {
            return;
        }

        $email = trim((string) ($settings['alertEmail'] ?? ''));

        if ($email === '') {
            return;
        }

        $request = $event->request;
        $identifier = trim((string) $request->input(Fortify::username(), ''));
        $ip = $request->ip() ?? 'unknown';
        $availableIn = $this->limiter->availableIn($request);
        $cacheKey = 'login-lockout-alert:'.sha1($identifier.'|'.$ip);

        if (! Cache::add($cacheKey, true, max(1, $availableIn))) {
            return;
        }

        try {
            Mail::to($email)->send(new LoginLockoutAlert([
                'identifier' => $identifier,
                'ip' => $ip,
                'userAgent' => (string) $request->userAgent(),
                'availableIn' => $availableIn,
                'occurredAt' => now()->format('Y-m-d H:i:s'),
            ]));
        } catch (Throwable $exception) {
            report($exception);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function settings(): array
    {
        $setting = SchoolSetting::query()
            ->where('group', 'login')
            ->where('key', SchoolSettingService::GROUP_KEYS['login'])
            ->first(['value']);

        return is_array($setting?->value) ? $setting->value : [];
    }
}
