<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminActivityLogCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_activity_logs_page(): void
    {
        $this->withoutVite();
        $this->actingAs(User::factory()->create());

        $user = User::factory()->create(['name' => 'Admin User']);
        ActivityLog::factory()->for($user)->create([
            'event' => 'manual',
            'description' => 'Manual audit entry',
        ]);

        $this->get(route('admin.activity-logs'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/activity-logs/index')
                ->has('logs', 1)
                ->where('logs.0.userName', 'Admin User')
                ->where('logs.0.event', 'manual')
                ->where('logs.0.description', 'Manual audit entry'));
    }

    public function test_admin_can_create_activity_log(): void
    {
        $this->actingAs(User::factory()->create());
        $user = User::factory()->create();

        $this->post(route('admin.activity-logs.store'), $this->validPayload($user->id))
            ->assertRedirect(route('admin.activity-logs'));

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $user->id,
            'event' => 'manual',
            'description' => 'Manual audit entry',
            'ip_address' => '127.0.0.1',
        ]);
    }

    public function test_admin_can_update_activity_log(): void
    {
        $this->actingAs(User::factory()->create());
        $activityLog = ActivityLog::factory()->create([
            'event' => 'manual',
            'description' => 'Manual audit entry',
        ]);

        $payload = $this->validPayload($activityLog->user_id);
        $payload['event'] = 'updated';
        $payload['description'] = 'Updated audit entry';

        $this->put(route('admin.activity-logs.update', $activityLog), $payload)
            ->assertRedirect(route('admin.activity-logs'));

        $this->assertDatabaseHas('activity_logs', [
            'id' => $activityLog->id,
            'event' => 'updated',
            'description' => 'Updated audit entry',
        ]);
    }

    public function test_admin_can_delete_activity_log(): void
    {
        $this->actingAs(User::factory()->create());
        $activityLog = ActivityLog::factory()->create();

        $this->delete(route('admin.activity-logs.destroy', $activityLog))
            ->assertRedirect(route('admin.activity-logs'));

        $this->assertDatabaseMissing('activity_logs', [
            'id' => $activityLog->id,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(?int $userId): array
    {
        return [
            'user_id' => $userId,
            'event' => 'manual',
            'description' => 'Manual audit entry',
            'properties' => [
                'source' => 'test',
            ],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
        ];
    }
}
