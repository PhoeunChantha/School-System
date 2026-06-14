<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\AppInstallationLink;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppInstallationManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_generate_individual_and_class_installation_links(): void
    {
        $admin = $this->adminWithPermissions();
        $class = SchoolClass::factory()->create();
        $student = Student::factory()->for($class, 'schoolClass')->create();

        $this->actingAs($admin)->post(route('admin.app-installations.store'), [
            'mode' => 'individual', 'audience' => 'student', 'student_id' => $student->id, 'expires_days' => 30,
        ])->assertRedirect();

        $this->assertDatabaseCount('app_installation_links', 1);

        Student::factory()->count(2)->for($class, 'schoolClass')->create();
        $this->actingAs($admin)->post(route('admin.app-installations.store'), [
            'mode' => 'class', 'audience' => 'both', 'class_id' => $class->id, 'expires_days' => 30,
        ])->assertRedirect();

        $this->assertDatabaseCount('app_installation_links', 7);
        $this->assertDatabaseHas('activity_logs', ['event' => 'app_installation_links_generated']);
    }

    public function test_admin_can_render_qr_regenerate_and_revoke_a_link(): void
    {
        $admin = $this->adminWithPermissions();
        $link = AppInstallationLink::factory()->create(['created_by' => $admin->id]);

        $this->actingAs($admin)->get(route('admin.app-installations.qr', $link))->assertOk()->assertHeaderContains('Content-Type', 'image/svg+xml')->assertSee('<svg', false);
        $this->actingAs($admin)->post(route('admin.app-installations.regenerate', $link))->assertRedirect();

        $link->refresh();
        $this->assertNotNull($link->revoked_at);
        $replacement = AppInstallationLink::query()->where('regenerated_from_id', $link->id)->firstOrFail();
        $this->actingAs($admin)->put(route('admin.app-installations.revoke', $replacement))->assertRedirect();
        $this->assertNotNull($replacement->refresh()->revoked_at);
        $this->assertSame(2, ActivityLog::query()->whereIn('event', ['app_installation_link_regenerated', 'app_installation_link_revoked'])->count());
    }

    public function test_user_without_permissions_cannot_manage_installation_links(): void
    {
        $this->seed(PermissionSeeder::class);
        $user = User::factory()->create();
        $link = AppInstallationLink::factory()->create();

        $this->be($user);
        $this->get(route('admin.app-installations'))->assertForbidden();
        $this->put(route('admin.app-installations.revoke', $link))->assertForbidden();
    }

    private function adminWithPermissions(): User
    {
        $this->seed(PermissionSeeder::class);
        $user = User::factory()->create();
        $user->givePermissionTo(['app-installations.view', 'app-installations.create', 'app-installations.update']);

        return $user;
    }
}
