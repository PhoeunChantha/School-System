<?php

namespace Tests\Feature;

use App\Models\ParentAccessToken;
use App\Models\SchoolSetting;
use App\Models\SmsCommunication;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminSmsCommunicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_parent_sms_attempt_is_recorded_and_visible_to_admin(): void
    {
        Http::fake(['cloudapi.plasgate.com/*' => Http::response(['success' => true])]);
        $this->enableParentSmsAccess();
        $student = Student::factory()->create(['parent_phone' => '012345678']);

        $this->post(route('parent.access-link'), ['phone' => '012345678'])->assertValid();

        $this->assertDatabaseHas('sms_communications', [
            'student_id' => $student->id,
            'phone' => '85512345678',
            'status' => 'sent',
            'attempt_count' => 1,
            'provider_status' => 200,
        ]);

        $this->actingAsAdmin()
            ->get(route('admin.sms-communications'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/sms-communications/index')
                ->has('messages', 1)
                ->where('messages.0.studentName', $student->name_en)
                ->where('messages.0.status', 'sent'));
    }

    public function test_admin_can_retry_an_unexpired_failed_sms(): void
    {
        Http::fake(['cloudapi.plasgate.com/*' => Http::response(['success' => true])]);
        $this->enableParentSmsAccess();

        $token = ParentAccessToken::query()->create([
            'phone' => '85512345678',
            'token_hash' => hash('sha256', 'retry-token'),
            'expires_at' => now()->addMinutes(10),
        ]);
        $sms = SmsCommunication::factory()->create([
            'parent_access_token_id' => $token->id,
            'phone' => '85512345678',
            'message' => 'Parent link: https://example.test/parent/access/retry-token',
            'status' => 'failed',
            'attempt_count' => 1,
            'provider_status' => 403,
            'sent_at' => null,
        ]);

        $this->actingAsAdmin()
            ->post(route('admin.sms-communications.retry', $sms))
            ->assertRedirect();

        $this->assertDatabaseHas('sms_communications', [
            'id' => $sms->id,
            'status' => 'sent',
            'attempt_count' => 2,
            'provider_status' => 200,
        ]);
    }

    public function test_admin_receives_an_error_when_a_failed_sms_is_no_longer_retryable(): void
    {
        $this->enableParentSmsAccess();

        $token = ParentAccessToken::query()->create([
            'phone' => '85512345678',
            'token_hash' => hash('sha256', 'expired-token'),
            'expires_at' => now()->subMinute(),
        ]);
        $sms = SmsCommunication::factory()->create([
            'parent_access_token_id' => $token->id,
            'phone' => '85512345678',
            'status' => 'failed',
            'attempt_count' => 1,
        ]);

        $this->actingAsAdmin()
            ->post(route('admin.sms-communications.retry', $sms))
            ->assertSessionHasErrors('sms');

        $this->assertDatabaseHas('sms_communications', [
            'id' => $sms->id,
            'status' => 'failed',
            'attempt_count' => 1,
        ]);
    }

    private function actingAsAdmin(): self
    {
        $this->seed(PermissionSeeder::class);
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create();
        $user->syncRoles([Role::query()->where('name', 'admin')->firstOrFail()]);

        return $this->actingAs($user);
    }

    private function enableParentSmsAccess(): void
    {
        SchoolSetting::factory()->create([
            'group' => 'login',
            'key' => 'security',
            'value' => [
                'parentAccessEnabled' => true,
                'parentAccessExpiresMinutes' => '10',
                'parentSmsProvider' => 'plasgate',
                'plasgateEndpoint' => 'https://cloudapi.plasgate.com/rest/send',
                'plasgateSecret' => 'secret-key',
                'plasgatePrivate' => 'private-key',
                'plasgateSender' => 'Frania',
                'parentSmsTemplate' => 'Parent link: {link}. Expires in {minutes} minutes.',
            ],
        ]);
    }
}
