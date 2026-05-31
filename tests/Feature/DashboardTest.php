<?php

namespace Tests\Feature;

use App\Models\GradePeriod;
use App\Models\GradeRecord;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('dashboard'))->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $this->withoutVite();
        $this->actingAs($user = User::factory()->create());

        $this->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('dashboard'));
    }

    public function test_dashboard_includes_top_student_scores(): void
    {
        $this->withoutVite();

        $student = Student::factory()->create(['name_en' => 'Top Student']);
        $period = GradePeriod::factory()->create(['name' => 'Midterm 2026']);

        GradeRecord::factory()->create([
            'student_id' => $student->id,
            'school_class_id' => $student->school_class_id,
            'grade_period_id' => $period->id,
            'speaking' => 96,
            'listening' => 94,
            'reading' => 98,
            'writing' => 92,
            'average' => 95,
        ]);

        $this->actingAs(User::factory()->create());

        $this->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->has('topStudentScores', 1)
                ->where('topStudentScores.0.nameEn', 'Top Student')
                ->where('topStudentScores.0.period', 'Midterm 2026')
                ->where('topStudentScores.0.score', 95));
    }

    public function test_teacher_users_see_teacher_dashboard(): void
    {
        $this->withoutVite();

        $user = User::factory()->create();
        $this->actingAs($user);
        $this->syncRole($user, 'teacher');

        $this->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard/teacher')
                ->has('profile')
                ->has('stats'));
    }

    public function test_student_users_see_student_dashboard(): void
    {
        $this->withoutVite();

        $user = User::factory()->create();
        $this->actingAs($user);
        $this->syncRole($user, 'student');

        $this->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard/student')
                ->has('profile')
                ->has('stats'));
    }

    private function syncRole(User $user, string $roleName): void
    {
        $permission = Permission::query()->firstOrCreate([
            'name' => 'dashboard.view',
            'guard_name' => 'web',
        ]);

        $role = Role::query()->firstOrCreate([
            'name' => $roleName,
            'guard_name' => 'web',
        ]);

        $role->syncPermissions([$permission]);
        $user->syncRoles([$role]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
