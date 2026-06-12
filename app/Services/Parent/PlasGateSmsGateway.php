<?php

namespace App\Services\Parent;

use App\Exceptions\PlasGateSmsException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PlasGateSmsGateway
{
    /**
     * @param  array{plasgateEndpoint: string, plasgateSecret: string, plasgatePrivate: string, plasgateSender: string}  $settings
     */
    public function send(string $phone, string $message, array $settings): array
    {
        foreach (['plasgateEndpoint', 'plasgateSecret', 'plasgatePrivate', 'plasgateSender'] as $key) {
            if (trim((string) ($settings[$key] ?? '')) === '') {
                throw new PlasGateSmsException('PlasGate SMS settings are incomplete.');
            }
        }

        $endpoint = $settings['plasgateEndpoint']
            .(str_contains($settings['plasgateEndpoint'], '?') ? '&' : '?')
            .'private_key='.rawurlencode($settings['plasgatePrivate']);

        Log::info('Parent access PlasGate SMS dispatching', [
            'endpoint' => $settings['plasgateEndpoint'],
            'phone' => $phone,
            'sender' => $settings['plasgateSender'],
            'secret_length' => strlen($settings['plasgateSecret']),
            'private_key_length' => strlen($settings['plasgatePrivate']),
        ]);

        $options = [];

        if (defined('CURLOPT_IPRESOLVE') && defined('CURL_IPRESOLVE_V4')) {
            $options['curl'] = [
                CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
            ];
        }

        $response = Http::withHeaders([
            'Accept' => 'application/json',
            'X-Secret' => $settings['plasgateSecret'],
        ])
            ->withOptions($options)
            ->asJson()
            ->timeout(15)
            ->post($endpoint, [
                'to' => $phone,
                'sender' => $settings['plasgateSender'],
                'content' => $message,
            ]);

        if ($response->failed()) {
            if ($response->status() === 403) {
                throw new PlasGateSmsException(
                    'PlasGate rejected the SMS request with 403 Forbidden. Check API key trusted IP/domain allowance, enabled key status, account balance, and approved sender ID.',
                    $response->status(),
                    $response->body(),
                );
            }

            throw new PlasGateSmsException(
                'PlasGate SMS request failed: '.$response->body(),
                $response->status(),
                $response->body(),
            );
        }

        return [
            'statusCode' => $response->status(),
            'responseBody' => $response->body(),
        ];
    }
}
