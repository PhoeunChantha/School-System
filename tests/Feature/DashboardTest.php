<?php

namespace Tests\Feature;

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
