<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class PermissionSeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function test_permission_seeder_creates_feature_permissions_and_super_admin_role(): void
    {
        User::factory()->create(['email' => 'admin@frania.edu.kh']);

        $this->seed(PermissionSeeder::class);

        $this->assertDatabaseHas('permissions', ['name' => 'students.view', 'guard_name' => 'web']);
        $this->assertDatabaseHas('permissions', ['name' => 'teachers.create', 'guard_name' => 'web']);
        $this->assertDatabaseHas('permissions', ['name' => 'homework-submissions.update', 'guard_name' => 'web']);
        $this->assertDatabaseHas('permissions', ['name' => 'notifications.mark-all-read', 'guard_name' => 'web']);
        $this->assertDatabaseHas('permissions', ['name' => 'permissions.delete', 'guard_name' => 'web']);

        $role = Role::where('name', 'super-admin')->firstOrFail();
        $admin = User::where('email', 'admin@frania.edu.kh')->firstOrFail();

        $this->assertTrue($role->hasPermissionTo('students.view'));
        $this->assertTrue($role->hasPermissionTo('settings.update'));
        $this->assertTrue($admin->hasRole('super-admin'));
        $this->assertSame(Permission::count(), $role->permissions()->count());
    }
}
