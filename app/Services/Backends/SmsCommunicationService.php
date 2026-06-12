<?php

namespace App\Services\Backends;

use App\Exceptions\PlasGateSmsException;
use App\Models\ParentAccessToken;
use App\Models\SmsCommunication;
use App\Models\Student;
use App\Services\Parent\PlasGateSmsGateway;
use App\Support\ParentAccessSettings;
use RuntimeException;
use Throwable;

class SmsCommunicationService
{
    public function __construct(
        private readonly PlasGateSmsGateway $smsGateway,
        private readonly ParentAccessSettings $parentAccessSettings,
    ) {}

    /** @return array<string, mixed> */
    public function indexData(): array
    {
        $messages = SmsCommunication::query()
            ->with(['student:id,name_en,name_kh,code', 'parentAccessToken:id,expires_at,used_at'])
            ->latest()
            ->get()
            ->map(fn (SmsCommunication $sms): array => $this->payload($sms));

        return [
            'messages' => $messages,
            'summary' => [
                'total' => $messages->count(),
                'sent' => $messages->where('status', 'sent')->count(),
                'failed' => $messages->where('status', 'failed')->count(),
                'attempts' => $messages->sum('attemptCount'),
            ],
        ];
    }

    /**
     * @param  array{plasgateEndpoint: string, plasgateSecret: string, plasgatePrivate: string, plasgateSender: string}  $settings
     */
    public function send(
        ?Student $student,
        ParentAccessToken $accessToken,
        string $phone,
        string $message,
        array $settings,
    ): SmsCommunication {
        $sms = SmsCommunication::query()->create([
            'student_id' => $student?->id,
            'parent_access_token_id' => $accessToken->id,
            'phone' => $phone,
            'provider' => 'plasgate',
            'sender' => $settings['plasgateSender'],
            'message' => $message,
            'status' => 'pending',
            'attempt_count' => 1,
            'last_attempted_at' => now(),
        ]);

        return $this->dispatch($sms, $settings);
    }

    public function retry(SmsCommunication $sms): SmsCommunication
    {
        if ($sms->status !== 'failed') {
            throw new RuntimeException('Only failed SMS messages can be retried.');
        }

        $sms->loadMissing('parentAccessToken');

        if (! $sms->parentAccessToken || $sms->parentAccessToken->expires_at->isPast() || $sms->parentAccessToken->used_at) {
            throw new RuntimeException('The parent access link is expired or already used. Ask the parent to request a new link.');
        }

        $settings = $this->parentAccessSettings->data();

        $sms->update([
            'status' => 'pending',
            'attempt_count' => $sms->attempt_count + 1,
            'provider_status' => null,
            'provider_response' => null,
            'failure_reason' => null,
            'last_attempted_at' => now(),
        ]);

        return $this->dispatch($sms, $settings);
    }

    /** @param array<string, mixed> $settings */
    private function dispatch(SmsCommunication $sms, array $settings): SmsCommunication
    {
        try {
            $result = $this->smsGateway->send($sms->phone, $sms->message, $settings);

            $sms->update([
                'status' => 'sent',
                'provider_status' => $result['statusCode'],
                'provider_response' => $result['responseBody'],
                'sent_at' => now(),
            ]);
        } catch (Throwable $exception) {
            $sms->update([
                'status' => 'failed',
                'provider_status' => $exception instanceof PlasGateSmsException ? $exception->statusCode : null,
                'provider_response' => $exception instanceof PlasGateSmsException ? $exception->responseBody : null,
                'failure_reason' => $exception->getMessage(),
            ]);

            throw $exception;
        }

        return $sms->refresh();
    }

    /** @return array<string, mixed> */
    private function payload(SmsCommunication $sms): array
    {
        return [
            'id' => $sms->id,
            'routeKey' => $sms->routeKey(),
            'studentName' => $sms->student?->name_en ?? $sms->student?->name_kh ?? 'Unknown student',
            'studentCode' => $sms->student?->code ?? '',
            'phone' => $sms->phone,
            'provider' => ucfirst($sms->provider),
            'sender' => $sms->sender ?? '',
            'message' => $sms->message,
            'status' => $sms->status,
            'attemptCount' => $sms->attempt_count,
            'providerStatus' => $sms->provider_status,
            'providerResponse' => $sms->provider_response ?? '',
            'failureReason' => $sms->failure_reason ?? '',
            'canRetry' => $sms->status === 'failed' && $sms->parentAccessToken?->expires_at?->isFuture() === true && $sms->parentAccessToken?->used_at === null,
            'lastAttemptedAt' => $sms->last_attempted_at?->format('Y-m-d H:i:s'),
            'sentAt' => $sms->sent_at?->format('Y-m-d H:i:s'),
            'createdAt' => $sms->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
