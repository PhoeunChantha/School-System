<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\PushSubscription;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class WebPushService
{
    public function isConfigured(): bool
    {
        return filled(config('services.webpush.public_key')) && filled(config('services.webpush.private_key'));
    }

    public function sendForNotification(Notification $notification): void
    {
        if (! $this->isConfigured()) {
            return;
        }

        PushSubscription::query()
            ->where(function ($query) use ($notification): void {
                $query->where('student_id', $notification->student_id);

                if ($notification->user_id !== null) {
                    $query->orWhere('user_id', $notification->user_id);
                }
            })
            ->get()
            ->each(function (PushSubscription $subscription): void {
                $response = $this->sendEmptyPush($subscription->endpoint);

                if (in_array($response->status(), [404, 410], true)) {
                    $subscription->delete();

                    return;
                }

                if ($response->successful()) {
                    $subscription->update(['last_used_at' => now()]);
                }
            });
    }

    private function sendEmptyPush(string $endpoint): Response
    {
        $publicKey = (string) config('services.webpush.public_key');
        $jwt = $this->vapidJwt($endpoint);

        return Http::withHeaders([
            'Authorization' => "vapid t={$jwt}, k={$publicKey}",
            'TTL' => '86400',
            'Urgency' => 'normal',
        ])
            ->timeout(10)
            ->post($endpoint);
    }

    private function vapidJwt(string $endpoint): string
    {
        $audience = parse_url($endpoint, PHP_URL_SCHEME).'://'.parse_url($endpoint, PHP_URL_HOST);
        $port = parse_url($endpoint, PHP_URL_PORT);

        if ($port !== null) {
            $audience .= ':'.$port;
        }

        $header = $this->base64UrlEncode(json_encode([
            'typ' => 'JWT',
            'alg' => 'ES256',
        ], JSON_THROW_ON_ERROR));

        $claims = $this->base64UrlEncode(json_encode([
            'aud' => $audience,
            'exp' => now()->addHour()->unix(),
            'sub' => (string) config('services.webpush.subject'),
        ], JSON_THROW_ON_ERROR));

        $unsignedToken = $header.'.'.$claims;
        $privateKey = openssl_pkey_get_private(base64_decode((string) config('services.webpush.private_key')));

        if ($privateKey === false || ! openssl_sign($unsignedToken, $derSignature, $privateKey, OPENSSL_ALGO_SHA256)) {
            throw new \RuntimeException('Unable to sign Web Push VAPID token.');
        }

        return $unsignedToken.'.'.$this->base64UrlEncode($this->derSignatureToJose($derSignature));
    }

    private function derSignatureToJose(string $derSignature): string
    {
        $offset = 3;
        $rLength = ord($derSignature[$offset]);
        $r = substr($derSignature, $offset + 1, $rLength);
        $offset += $rLength + 2;
        $sLength = ord($derSignature[$offset]);
        $s = substr($derSignature, $offset + 1, $sLength);

        return str_pad(ltrim($r, "\x00"), 32, "\x00", STR_PAD_LEFT)
            .str_pad(ltrim($s, "\x00"), 32, "\x00", STR_PAD_LEFT);
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
