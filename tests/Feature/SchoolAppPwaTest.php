<?php

namespace Tests\Feature;

use App\Models\AppInstallationLink;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolAppPwaTest extends TestCase
{
    use RefreshDatabase;

    public function test_shared_manifest_uses_school_brand_and_installation_start_url(): void
    {
        SchoolSetting::factory()->create(['group' => 'school', 'key' => 'profile', 'value' => ['nameEn' => 'Test School', 'logo' => null, 'favicon' => null]]);
        $link = AppInstallationLink::factory()->create();

        $this->get(route('school-app.manifest', ['installation' => $link->token]))
            ->assertOk()->assertJsonPath('name', 'Test School School App')->assertJsonPath('scope', '/')
            ->assertJsonPath('start_url', route('home', ['installation' => $link->token], false));
    }

    public function test_installation_open_and_tracking_events_are_recorded(): void
    {
        $link = AppInstallationLink::factory()->create();

        $this->get(route('app-install.show', $link->token))->assertOk();
        $this->assertNotNull($link->refresh()->opened_at);
        $this->postJson(route('app-install.track', $link->token), ['event' => 'install_started', 'platform' => 'Android', 'browser' => 'Chrome'])->assertOk();

        $link->refresh();
        $this->assertNotNull($link->install_started_at);
        $this->assertSame('Android', $link->platform);
        $this->assertDatabaseHas('app_installation_events', ['app_installation_link_id' => $link->id, 'event' => 'install_started']);
    }

    public function test_expired_revoked_and_invalid_links_are_rejected(): void
    {
        $expired = AppInstallationLink::factory()->create(['expires_at' => now()->subMinute()]);
        $revoked = AppInstallationLink::factory()->create(['revoked_at' => now()]);

        $this->get(route('app-install.show', $expired->token))->assertGone();
        $this->get(route('app-install.show', $revoked->token))->assertGone();
        $this->get(route('app-install.show', 'invalid-token'))->assertGone();
    }

    public function test_confirmation_requires_matching_student_or_parent_identity(): void
    {
        $this->seed(PermissionSeeder::class);
        $this->seed(RoleSeeder::class);
        $studentUser = User::factory()->create();
        $studentUser->assignRole('student');
        $student = Student::factory()->create(['user_id' => $studentUser->id, 'parent_phone' => '012345678']);
        $studentLink = AppInstallationLink::factory()->for($student)->create(['audience' => 'student']);

        $this->actingAs($studentUser)->get(route('home', ['installation' => $studentLink->token]))->assertRedirect();
        $this->assertNotNull($studentLink->refresh()->confirmed_at);

        $otherStudent = Student::factory()->create(['parent_phone' => '098765432']);
        $parentLink = AppInstallationLink::factory()->for($student)->create(['audience' => 'parent']);
        $this->withSession(['parent_access_phone' => $otherStudent->parent_phone])->get(route('school-app.launch', ['installation' => $parentLink->token]))->assertOk();
        $this->assertNull($parentLink->refresh()->confirmed_at);
        $this->withSession(['parent_access_phone' => '85512345678'])->get(route('school-app.launch', ['installation' => $parentLink->token]))->assertOk();
        $this->assertNotNull($parentLink->refresh()->confirmed_at);
    }

    public function test_shared_service_worker_preserves_student_push_and_excludes_staff_routes(): void
    {
        $this->get(route('school-app.service-worker'))->assertOk()
            ->assertHeader('Service-Worker-Allowed', '/')
            ->assertSee("url.pathname.startsWith('/admin')", false)
            ->assertSee("url.pathname.startsWith('/teacher')", false)
            ->assertSee('/student/push-notifications/latest', false)
            ->assertSee("url.pathname.startsWith('/parent')", false);
    }

    public function test_app_without_session_opens_common_login_target(): void
    {
        $this->get(route('school-app.launch'))->assertOk()->assertInertia(fn ($page) => $page->component('app-install/launcher')->where('targetUrl', '/'));
    }

    public function test_installation_page_uses_same_origin_relative_pwa_urls(): void
    {
        config()->set('app.url', 'https://www.franiaschool.dev');
        $link = AppInstallationLink::factory()->create();

        $this->get('https://franiaschool.dev/install/'.$link->token)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('app-install/index')
                ->where('manifestUrl', '/manifest.webmanifest?installation='.$link->token)
                ->where('trackUrl', '/install/'.$link->token.'/events')
                ->where('launchUrl', '/?installation='.$link->token));
    }

    public function test_installation_start_url_opens_login_and_remembers_the_link(): void
    {
        $link = AppInstallationLink::factory()->create();

        $this->get(route('home', ['installation' => $link->token]))
            ->assertOk()
            ->assertSessionHas('app_installation_token_hash', $link->token_hash)
            ->assertInertia(fn ($page) => $page->component('auth/login'));
    }
}
