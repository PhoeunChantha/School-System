<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\PushSubscription;
use App\Models\Student;
use App\Models\User;
use App\Services\WebPushService;
use GuzzleHttp\Psr7\Request;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Minishlink\WebPush\MessageSentReport;
use Minishlink\WebPush\WebPush;
use Tests\TestCase;

class StudentWebPushTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_store_push_subscription(): void
    {
        config()->set('services.webpush.public_key', 'public-key');
        config()->set('services.webpush.private_key', 'private-key');

        $user = User::factory()->create();
        $student = Student::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->postJson(route('student.push-notifications.subscriptions.store'), [
                'endpoint' => 'https://updates.push.services.mozilla.com/wpush/v2/test-endpoint',
                'keys' => [
                    'p256dh' => 'student-public-key',
                    'auth' => 'student-auth-token',
                ],
            ])
            ->assertOk()
            ->assertJsonPath('subscribed', true);

        $this->assertDatabaseHas('push_subscriptions', [
            'user_id' => $user->id,
            'student_id' => $student->id,
            'endpoint' => 'https://updates.push.services.mozilla.com/wpush/v2/test-endpoint',
        ]);
    }

    public function test_student_can_fetch_latest_unread_notification_for_service_worker(): void
    {
        $user = User::factory()->create();
        $student = Student::factory()->create(['user_id' => $user->id]);
        $notification = Notification::factory()->create([
            'student_id' => $student->id,
            'user_id' => $user->id,
            'title' => 'Homework update',
            'body' => 'Open the Homework tab.',
            'read_at' => null,
        ]);

        $response = $this->actingAs($user)
            ->getJson(route('student.push-notifications.latest'))
            ->assertOk()
            ->assertJsonPath('notification.title', 'Homework update')
            ->assertJsonPath('notification.body', 'Open the Homework tab.');

        $this->assertStringContainsString(
            '/student/notifications/',
            $response->json('notification.url'),
        );
    }

    public function test_student_service_worker_handles_push_notifications(): void
    {
        $this->get(route('student.service-worker'))
            ->assertOk()
            ->assertSee("self.addEventListener('push'", false)
            ->assertSee('self.registration.showNotification', false)
            ->assertSee('/student/push-notifications/latest', false);
    }

    public function test_student_can_remove_own_push_subscription(): void
    {
        $user = User::factory()->create();
        $subscription = PushSubscription::factory()->create([
            'user_id' => $user->id,
            'endpoint' => 'https://updates.push.services.mozilla.com/wpush/v2/test-endpoint',
        ]);

        $this->actingAs($user)
            ->deleteJson(route('student.push-notifications.subscriptions.destroy'), [
                'endpoint' => $subscription->endpoint,
            ])
            ->assertNoContent();

        $this->assertDatabaseMissing('push_subscriptions', [
            'id' => $subscription->id,
        ]);
    }

    public function test_global_student_notification_sends_push_to_all_subscriptions(): void
    {
        config()->set('services.webpush.public_key', 'public-key');
        config()->set('services.webpush.private_key', 'private-key');
        config()->set('services.webpush.subject', 'mailto:test@example.com');

        PushSubscription::factory()->count(2)->create();
        $notification = Notification::factory()->create([
            'student_id' => null,
            'user_id' => null,
            'read_at' => null,
        ]);

        $service = new class extends WebPushService
        {
            public int $sentCount = 0;

            protected function webPush(): WebPush
            {
                return new WebPush;
            }

            protected function sendNotification(
                WebPush $webPush,
                PushSubscription $pushSubscription,
                Notification $notification,
            ): MessageSentReport {
                $this->sentCount++;

                $pushSubscription->update(['last_used_at' => now()]);

                return new MessageSentReport(
                    new Request('POST', $pushSubscription->endpoint),
                );
            }
        };

        $service->sendForNotification($notification);

        $this->assertSame(2, $service->sentCount);
    }

    public function test_notification_without_matching_subscription_does_not_start_web_push(): void
    {
        config()->set('services.webpush.public_key', 'public-key');
        config()->set('services.webpush.private_key', 'private-key');
        config()->set('services.webpush.subject', 'mailto:test@example.com');

        $student = Student::factory()->create();
        $notification = Notification::factory()->create([
            'student_id' => $student->id,
            'user_id' => $student->user_id,
            'read_at' => null,
        ]);

        $service = new class extends WebPushService
        {
            public bool $started = false;

            protected function webPush(): WebPush
            {
                $this->started = true;

                return new WebPush;
            }
        };

        $service->sendForNotification($notification);

        $this->assertFalse($service->started);
    }
}
