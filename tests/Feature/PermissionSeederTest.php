<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
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

    public function test_permission_seeder_creates_feature_permissions_and_default_roles(): void
    {
        User::factory()->create(['email' => 'admin@frania.edu.kh']);

        $this->seed(PermissionSeeder::class);
        $this->seed(RoleSeeder::class);

        $this->assertDatabaseHas('permissions', ['name' => 'students.view', 'guard_name' => 'web']);
        $this->assertDatabaseHas('permissions', ['name' => 'students.import', 'guard_name' => 'web']);
        $this->assertDatabaseHas('permissions', ['name' => 'teachers.download-layout', 'guard_name' => 'web']);
        $this->assertDatabaseHas('permissions', ['name' => 'teacher-grades.update', 'guard_name' => 'web']);
        $this->assertDatabaseHas('permissions', ['name' => 'attendance.export', 'guard_name' => 'web']);
        $this->assertDatabaseHas('permissions', ['name' => 'homework-submissions.update', 'guard_name' => 'web']);
        $this->assertDatabaseHas('permissions', ['name' => 'notifications.mark-all-read', 'guard_name' => 'web']);
        $this->assertDatabaseHas('permissions', ['name' => 'permissions.delete', 'guard_name' => 'web']);

        $adminRole = Role::where('name', 'admin')->firstOrFail();
        $teacherRole = Role::where('name', 'teacher')->firstOrFail();
        $studentRole = Role::where('name', 'student')->firstOrFail();
        $admin = User::where('email', 'admin@frania.edu.kh')->firstOrFail();

        $this->assertTrue($adminRole->hasPermissionTo('students.view'));
        $this->assertTrue($adminRole->hasPermissionTo('settings.update'));
        $this->assertTrue($teacherRole->hasPermissionTo('teacher-grades.update'));
        $this->assertTrue($teacherRole->hasPermissionTo('homework-submissions.update'));
        $this->assertFalse($teacherRole->hasPermissionTo('roles.delete'));
        $this->assertTrue($studentRole->hasPermissionTo('homework-submissions.create'));
        $this->assertFalse($studentRole->hasPermissionTo('students.delete'));
        $this->assertTrue($admin->hasRole('admin'));
        $this->assertSame(Permission::count(), $adminRole->permissions()->count());
    }
}
