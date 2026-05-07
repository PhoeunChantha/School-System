<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminNotificationCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_notifications_page(): void
    {
        $this->actingAs(User::factory()->create());

        Notification::factory()->create([
            'category' => 'attendance',
            'title' => 'Low Attendance Alert',
            'data' => ['titleKh' => 'វត្តមានទាប'],
        ]);

        $this->get(route('admin.notifications'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/notifications/index')
                ->has('notifications', 1)
                ->where('notifications.0.title', 'Low Attendance Alert')
                ->where('notifications.0.titleKh', 'វត្តមានទាប')
                ->where('summary.unreadCount', 1));
    }

    public function test_admin_can_create_notification(): void
    {
        $user = User::factory()->create();
        $student = Student::factory()->create();

        $this->actingAs($user)
            ->post(route('admin.notifications.store'), $this->validPayload($student->id))
            ->assertRedirect(route('admin.notifications'));

        $this->assertDatabaseHas('notifications', [
            'category' => 'attendance',
            'title' => 'Low Attendance Alert',
            'student_id' => $student->id,
            'severity' => 'urgent',
            'created_by' => $user->id,
        ]);
    }

    public function test_admin_can_update_notification(): void
    {
        $notification = Notification::factory()->create([
            'title' => 'Low Attendance Alert',
            'severity' => 'urgent',
        ]);

        $payload = $this->validPayload();
        $payload['title'] = 'Attendance Follow Up';
        $payload['severity'] = 'warning';
        $payload['is_read'] = true;

        $this->actingAs(User::factory()->create())
            ->put(route('admin.notifications.update', $notification), $payload)
            ->assertRedirect(route('admin.notifications'));

        $notification->refresh();

        $this->assertSame('Attendance Follow Up', $notification->title);
        $this->assertSame('warning', $notification->severity);
        $this->assertNotNull($notification->read_at);
    }

    public function test_admin_can_mark_notification_read(): void
    {
        $this->actingAs(User::factory()->create());

        $notification = Notification::factory()->create(['read_at' => null]);

        $this->put(route('admin.notifications.read', $notification))
            ->assertRedirect(route('admin.notifications'));

        $this->assertNotNull($notification->refresh()->read_at);
    }

    public function test_admin_can_mark_all_notifications_read(): void
    {
        $this->actingAs(User::factory()->create());

        Notification::factory()->count(3)->create(['read_at' => null]);

        $this->put(route('admin.notifications.read-all'))
            ->assertRedirect(route('admin.notifications'));

        $this->assertSame(0, Notification::query()->whereNull('read_at')->count());
    }

    public function test_admin_can_delete_notification(): void
    {
        $this->actingAs(User::factory()->create());

        $notification = Notification::factory()->create();

        $this->delete(route('admin.notifications.destroy', $notification))
            ->assertRedirect(route('admin.notifications'));

        $this->assertDatabaseMissing('notifications', [
            'id' => $notification->id,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(?int $studentId = null): array
    {
        return [
            'category' => 'attendance',
            'title_kh' => 'វត្តមានទាប',
            'title' => 'Low Attendance Alert',
            'body' => 'Student attendance is below the threshold.',
            'severity' => 'urgent',
            'student_id' => $studentId,
            'user_id' => null,
            'is_read' => false,
        ];
    }
}
