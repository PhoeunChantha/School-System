<?php

namespace Tests;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

abstract class TestCase extends BaseTestCase
{
    /**
     * @param  Authenticatable  $user
     */
    public function actingAs($user, $guard = null)
    {
        if ($user instanceof User) {
            $this->grantAdminPermissions($user);
        }

        return parent::actingAs($user, $guard);
    }

    private function grantAdminPermissions(User $user): void
    {
        if (! Schema::hasTable('permissions') || ! Schema::hasTable('roles')) {
            return;
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $requiredPermissions = ['roles.view', 'permissions.view', 'settings.update'];

        if (Permission::query()->whereIn('name', $requiredPermissions)->count() !== count($requiredPermissions)) {
            $this->seed(PermissionSeeder::class);
        }

        $adminRole = Role::query()->firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'web',
        ]);

        $adminRole->syncPermissions(Permission::query()->pluck('name')->all());
        $user->syncRoles([$adminRole]);
    }
}
