<?php

namespace App\Support;

use App\Models\SchoolSetting;
use App\Services\Backends\SchoolSettingService;
use Illuminate\Support\Arr;

class ParentAccessSettings
{
    /**
     * @return array{
     *     enabled: bool,
     *     expiresMinutes: int,
     *     smsProvider: string,
     *     plasgateEndpoint: string,
     *     plasgateSecret: string,
     *     plasgatePrivate: string,
     *     plasgateSender: string,
     *     smsTemplate: string
     * }
     */
    public function data(): array
    {
        $value = SchoolSetting::query()
            ->where('group', 'login')
            ->where('key', SchoolSettingService::GROUP_KEYS['login'])
            ->value('value') ?? [];

        $endpoint = (string) Arr::get($value, 'plasgateEndpoint', 'https://cloudapi.plasgate.com/rest/send');

        return [
            'enabled' => (bool) Arr::get($value, 'parentAccessEnabled', false),
            'expiresMinutes' => max(1, min(60, (int) Arr::get($value, 'parentAccessExpiresMinutes', 10))),
            'smsProvider' => (string) Arr::get($value, 'parentSmsProvider', 'plasgate'),
            'plasgateEndpoint' => $this->normalizeEndpoint($endpoint),
            'plasgateSecret' => (string) Arr::get($value, 'plasgateSecret', Arr::get($value, 'plasgateUsername', '')),
            'plasgatePrivate' => (string) Arr::get($value, 'plasgatePrivate', Arr::get($value, 'plasgatePassword', '')),
            'plasgateSender' => (string) Arr::get($value, 'plasgateSender', ''),
            'smsTemplate' => (string) Arr::get(
                $value,
                'parentSmsTemplate',
                'Frania School parent access link: {link}. This link expires in {minutes} minutes.',
            ),
        ];
    }

    public function enabled(): bool
    {
        return $this->data()['enabled'];
    }

    public function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if (str_starts_with($digits, '0')) {
            return '855'.substr($digits, 1);
        }

        return $digits;
    }

    private function normalizeEndpoint(string $endpoint): string
    {
        $endpoint = trim($endpoint);

        if (str_ends_with($endpoint, '/api/send')) {
            return substr($endpoint, 0, -9).'/rest/send';
        }

        return $endpoint;
    }
}
