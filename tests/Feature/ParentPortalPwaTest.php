<?php

namespace Tests\Feature;

use App\Models\SchoolSetting;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ParentPortalPwaTest extends TestCase
{
    use RefreshDatabase;

    public function test_parent_manifest_uses_school_profile(): void
    {
        SchoolSetting::factory()->create([
            'group' => 'school',
            'key' => 'profile',
            'value' => [
                'nameEn' => 'Configured English School',
                'logo' => 'uploads/school/logo.png',
                'favicon' => 'uploads/school/favicon.png',
            ],
        ]);

        $this->get(route('parent.manifest'))
            ->assertOk()
            ->assertHeaderContains('Content-Type', 'application/manifest+json')
            ->assertJsonPath('name', 'Configured English School Parent Portal')
            ->assertJsonPath('short_name', 'Configured English School Parent')
            ->assertJsonPath('id', '/parent/')
            ->assertJsonPath('start_url', '/parent/dashboard')
            ->assertJsonPath('scope', '/parent/')
            ->assertJsonPath('display', 'standalone')
            ->assertJsonPath('icons.0.src', asset('uploads/school/logo.png'));
    }

    public function test_parent_service_worker_is_scoped_to_parent_routes(): void
    {
        $this->get(route('parent.service-worker'))
            ->assertOk()
            ->assertHeaderContains('Content-Type', 'text/javascript')
            ->assertHeader('Service-Worker-Allowed', '/parent/')
            ->assertSee("url.pathname.startsWith('/parent')", false)
            ->assertSee("request.method !== 'GET'", false)
            ->assertSee("const CACHE_NAME = 'parent-portal-v", false);
    }

    public function test_parent_offline_page_is_public_and_not_indexable(): void
    {
        $this->get(route('parent.offline'))
            ->assertOk()
            ->assertHeader('Content-Type', 'text/html; charset=UTF-8')
            ->assertSee('Parent Portal is offline')
            ->assertSee('noindex,nofollow', false);
    }

    public function test_parent_dashboard_renders_for_linked_student_account(): void
    {
        $this->withoutVite();

        Student::factory()->create([
            'parent_phone' => '012345678',
            'name_en' => 'Dara Keo',
            'code' => 'STU-1001',
        ]);

        $this->withSession(['parent_access_phone' => '85512345678'])
            ->get(route('parent.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('parent/dashboard/index')
                ->where('profile.name', 'Dara Keo')
                ->where('profile.code', 'STU-1001')
                ->has('stats')
                ->has('recentGrades')
                ->has('recentHomework')
                ->missing('recentFees')
                ->has('upcomingExams'));
    }

    public function test_parent_developer_access_sets_parent_session_in_non_production(): void
    {
        $this->withoutVite();

        $student = Student::factory()->create([
            'parent_phone' => '012 345 678',
            'name_en' => 'Dara Keo',
            'code' => 'STU-1001',
        ]);

        $this->get(route('parent.developer-access', ['student' => $student]))
            ->assertRedirect(route('parent.dashboard', absolute: false));

        $this->get(route('parent.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('parent/dashboard/index')
                ->where('profile.name', 'Dara Keo')
                ->where('profile.code', 'STU-1001'));
    }

    public function test_parent_detail_pages_render_for_linked_student_account(): void
    {
        $this->withoutVite();

        Student::factory()->create([
            'parent_phone' => '012345678',
            'name_en' => 'Dara Keo',
            'code' => 'STU-1001',
        ]);

        $this->withSession(['parent_access_phone' => '85512345678'])
            ->get(route('parent.attendance'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('parent/attendance/index')
                ->where('profile.name', 'Dara Keo')
                ->has('summary')
                ->has('records'));

        $this->withSession(['parent_access_phone' => '85512345678'])
            ->get(route('parent.grades'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('parent/grades/index')
                ->where('profile.name', 'Dara Keo')
                ->has('grades'));

        $this->withSession(['parent_access_phone' => '85512345678'])
            ->get(route('parent.homework'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('parent/homework/index')
                ->where('profile.name', 'Dara Keo')
                ->has('homework'));
    }
}
