<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class WebPushService
{
    public function isConfigured(): bool
    {
        return filled(config('services.webpush.public_key'))
            && filled(config('services.webpush.private_key'))
            && filled(config('services.webpush.subject'));
    }

    public function sendForNotification(Notification $notification): void
    {
        if (! $this->isConfigured()) {
            Log::warning('WebPush not configured');
            return;
        }

        $subscriptions = PushSubscription::query()
            ->when(
                $notification->student_id !== null || $notification->user_id !== null,
                function ($query) use ($notification) {
                    $query->where(function ($query) use ($notification) {
                        if ($notification->student_id !== null) {
                            $query->where('student_id', $notification->student_id);
                        }

                        if ($notification->user_id !== null) {
                            $query->orWhere('user_id', $notification->user_id);
                        }
                    });
                }
            )
            ->get();

        Log::info('WebPush started', [
            'notification_id' => $notification->id,
            'total_subscriptions' => $subscriptions->count(),
        ]);

        $webPush = new WebPush([
            'VAPID' => [
                'subject' => config('services.webpush.subject'),
                'publicKey' => config('services.webpush.public_key'),
                'privateKey' => config('services.webpush.private_key'),
            ],
        ]);

        foreach ($subscriptions as $pushSubscription) {
            try {
                $subscription = Subscription::create([
                    'endpoint' => $pushSubscription->endpoint,
                    'publicKey' => $pushSubscription->public_key,
                    'authToken' => $pushSubscription->auth_token,
                    'contentEncoding' => $pushSubscription->content_encoding ?? 'aes128gcm',
                ]);

                $payload = json_encode([
                    'title' => $notification->title ?? 'New Notification',
                    'body' => $notification->message ?? 'You have a new notification.',
                    'url' => '/student/notifications',
                    'icon' => '/icons/icon-192x192.png',
                ]);

                $report = $webPush->sendOneNotification($subscription, $payload);

                Log::info('WebPush report', [
                    'subscription_id' => $pushSubscription->id,
                    'success' => $report->isSuccess(),
                    'reason' => $report->getReason(),
                    'endpoint' => $report->getEndpoint(),
                ]);

                if ($report->isSuccess()) {
                    $pushSubscription->update([
                        'last_used_at' => now(),
                    ]);
                } else {
                    if ($report->isSubscriptionExpired()) {
                        $pushSubscription->delete();
                    }
                }
            } catch (\Throwable $e) {
                Log::error('WebPush exception', [
                    'subscription_id' => $pushSubscription->id,
                    'message' => $e->getMessage(),
                ]);
            }
        }
    }
}