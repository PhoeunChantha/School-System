<?php

namespace Tests\Feature;

use App\Models\SchoolSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentPortalPwaTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_manifest_is_scoped_to_student_portal(): void
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

        $this->get(route('student.manifest'))
            ->assertOk()
            ->assertHeaderContains('Content-Type', 'application/manifest+json')
            ->assertJsonPath('name', 'Configured English School Student Portal')
            ->assertJsonPath('short_name', 'Configured English School')
            ->assertJsonPath('id', '/student/')
            ->assertJsonPath('start_url', '/student/dashboard')
            ->assertJsonPath('scope', '/student/')
            ->assertJsonPath('display', 'standalone')
            ->assertJsonPath('icons.0.src', asset('uploads/school/logo.png'))
            ->assertJsonPath('icons.0.sizes', 'any')
            ->assertJsonPath('icons.0.type', 'image/png');
    }

    public function test_student_service_worker_is_scoped_and_avoids_staff_routes(): void
    {
        SchoolSetting::factory()->create([
            'group' => 'school',
            'key' => 'profile',
            'value' => [
                'nameEn' => 'Configured English School',
                'logo' => 'uploads/school/logo.png',
                'favicon' => 'uploads/school/favicon.ico',
            ],
        ]);

        $this->get(route('student.service-worker'))
            ->assertOk()
            ->assertHeaderContains('Content-Type', 'text/javascript')
            ->assertHeader('Service-Worker-Allowed', '/student/')
            ->assertSee('/student/', false)
            ->assertSee("url.pathname.startsWith('/admin')", false)
            ->assertSee("url.pathname.startsWith('/teacher')", false)
            ->assertSee("request.method !== 'GET'", false)
            ->assertSee("const CACHE_NAME = 'student-portal-v", false)
            ->assertSee('"/uploads/school/logo.png"', false)
            ->assertSee('"/uploads/school/favicon.ico"', false);
    }

    public function test_student_offline_page_is_public_and_not_indexable(): void
    {
        $this->get(route('student.offline'))
            ->assertOk()
            ->assertHeader('Content-Type', 'text/html; charset=UTF-8')
            ->assertSee('Student Portal is offline')
            ->assertSee('noindex,nofollow', false);
    }
}
