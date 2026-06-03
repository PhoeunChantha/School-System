<?php

namespace App\Support;

use App\Models\SchoolSetting;
use App\Services\Backends\SchoolSettingService;
use Illuminate\Http\Request;
use Laravel\Fortify\LoginRateLimiter;

class ConfigurableLoginRateLimiter extends LoginRateLimiter
{
    public function tooManyAttempts(Request $request): bool
    {
        return $this->limiter->tooManyAttempts(
            $this->throttleKey($request),
            $this->maxAttempts(),
        );
    }

    public function increment(Request $request): void
    {
        $this->limiter->hit(
            $this->throttleKey($request),
            $this->decaySeconds(),
        );
    }

    public function lockout(Request $request): void
    {
        $throttleKey = $this->throttleKey($request);

        $this->limiter->clear($throttleKey);
        $this->limiter->increment(
            $throttleKey,
            $this->decaySeconds(),
            $this->maxAttempts(),
        );
    }

    public function maxAttempts(): int
    {
        return max(1, min(20, (int) ($this->settings()['maxAttempts'] ?? 5)));
    }

    public function decaySeconds(): int
    {
        return max(1, min(3600, (int) ($this->settings()['decaySeconds'] ?? 15)));
    }

    /**
     * @return array<string, mixed>
     */
    public function settings(): array
    {
        $setting = SchoolSetting::query()
            ->where('group', 'login')
            ->where('key', SchoolSettingService::GROUP_KEYS['login'])
            ->first(['value']);

        return is_array($setting?->value) ? $setting->value : [];
    }
}
