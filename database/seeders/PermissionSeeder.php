<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    /**
     * @var array<string, array<int, string>>
     */
    private array $features = [
        'dashboard' => ['view'],
        'levels' => ['view', 'create', 'update', 'delete'],
        'students' => ['view', 'create', 'update', 'delete'],
        'teachers' => ['view', 'create', 'update', 'delete'],
        'classes' => ['view', 'create', 'update', 'delete'],
        'attendance' => ['view', 'create', 'update', 'delete'],
        'grades' => ['view', 'create', 'update', 'delete'],
        'homework' => ['view', 'create', 'update', 'delete'],
        'homework-submissions' => ['view', 'create', 'update', 'delete'],
        'lesson-plans' => ['view', 'create', 'update', 'delete'],
        'fee' => ['view', 'create', 'update', 'delete'],
        'fee-payments' => ['create'],
        'exam' => ['view', 'create', 'update', 'delete'],
        'exam-results' => ['view', 'create', 'update', 'delete'],
        'reports' => ['view'],
        'certificates' => ['view', 'create', 'update', 'delete'],
        'honor-roll' => ['view'],
        'notifications' => ['view', 'create', 'update', 'delete', 'mark-read', 'mark-all-read'],
        'activity-logs' => ['view', 'create', 'update', 'delete'],
        'roles' => ['view', 'create', 'update', 'delete'],
        'permissions' => ['view', 'create', 'update', 'delete'],
        'settings' => ['view', 'update'],
    ];

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = collect($this->features)
            ->flatMap(fn (array $actions, string $feature): array => array_map(
                fn (string $action): string => "{$feature}.{$action}",
                $actions,
            ))
            ->values();

        $permissions->each(fn (string $permission): Permission => Permission::firstOrCreate([
            'name' => $permission,
            'guard_name' => 'web',
        ]));

        $superAdmin = Role::firstOrCreate([
            'name' => 'super-admin',
            'guard_name' => 'web',
        ]);

        $superAdmin->syncPermissions($permissions->all());

        $admin = User::query()->where('email', 'admin@frania.edu.kh')->first();

        if ($admin instanceof User) {
            $admin->assignRole($superAdmin);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
