<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class AdminRolePermissionCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function test_admin_can_view_roles_and_permissions_page(): void
    {
        $this->withoutVite();

        $user = User::factory()->create();
        $permission = Permission::create(['name' => 'students.view', 'guard_name' => 'web']);
        $role = Role::create(['name' => 'manager', 'guard_name' => 'web']);
        $role->givePermissionTo($permission);
        $user->assignRole($role);

        $this->actingAs($user)
            ->get(route('admin.roles-permissions'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/roles-permissions/index')
                ->has('roles', 1)
                ->where('roles.0.name', 'manager')
                ->where('roles.0.permissionNames.0', 'students.view')
                ->has('permissions', 1)
                ->where('permissions.0.name', 'students.view')
                ->where('summary.roleCount', 1)
                ->where('summary.permissionCount', 1));
    }

    public function test_admin_can_create_role_with_permissions(): void
    {
        $permission = Permission::create(['name' => 'teachers.view', 'guard_name' => 'web']);

        $this->actingAs(User::factory()->create())
            ->post(route('admin.roles.store'), [
                'name' => 'teacher-admin',
                'guard_name' => 'web',
                'permission_ids' => [$permission->id],
            ])
            ->assertRedirect();

        $role = Role::where('name', 'teacher-admin')->firstOrFail();

        $this->assertTrue($role->hasPermissionTo('teachers.view'));
    }

    public function test_admin_can_update_role_permissions(): void
    {
        $oldPermission = Permission::create(['name' => 'students.view', 'guard_name' => 'web']);
        $newPermission = Permission::create(['name' => 'students.edit', 'guard_name' => 'web']);
        $role = Role::create(['name' => 'registrar', 'guard_name' => 'web']);
        $role->givePermissionTo($oldPermission);

        $this->actingAs(User::factory()->create())
            ->put(route('admin.roles.update', $role), [
                'name' => 'student-registrar',
                'guard_name' => 'web',
                'permission_ids' => [$newPermission->id],
            ])
            ->assertRedirect();

        $role->refresh();

        $this->assertSame('student-registrar', $role->name);
        $this->assertTrue($role->hasPermissionTo('students.edit'));
        $this->assertFalse($role->hasPermissionTo('students.view'));
    }

    public function test_admin_can_create_update_and_delete_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('admin.permissions.store'), [
                'name' => 'reports.view',
                'guard_name' => 'web',
            ])
            ->assertRedirect();

        $permission = Permission::where('name', 'reports.view')->firstOrFail();

        $this->actingAs(User::factory()->create())
            ->put(route('admin.permissions.update', $permission), [
                'name' => 'reports.export',
                'guard_name' => 'web',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('permissions', [
            'id' => $permission->id,
            'name' => 'reports.export',
            'guard_name' => 'web',
        ]);

        $this->actingAs(User::factory()->create())
            ->delete(route('admin.permissions.destroy', $permission))
            ->assertRedirect();

        $this->assertDatabaseMissing('permissions', [
            'id' => $permission->id,
        ]);
    }

    public function test_admin_can_delete_role(): void
    {
        $role = Role::create(['name' => 'temporary', 'guard_name' => 'web']);

        $this->actingAs(User::factory()->create())
            ->delete(route('admin.roles.destroy', $role))
            ->assertRedirect();

        $this->assertDatabaseMissing('roles', [
            'id' => $role->id,
        ]);
    }
}
