<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    /**
     * @var array<string, array<int, string>>
     */
    private array $features = [
        'dashboard' => ['view'],
        'levels' => ['view', 'create', 'update', 'delete'],
        'students' => ['view', 'show', 'create', 'update', 'delete', 'import', 'export', 'download-layout'],
        'enrollment-history' => ['view'],
        'sms-communications' => ['view', 'update'],
        'app-installations' => ['view', 'create', 'update', 'delete'],
        'teachers' => ['view', 'show', 'create', 'update', 'delete', 'import', 'export', 'download-layout'],
        'teacher-lesson-plans' => ['create'],
        'teacher-grades' => ['view', 'update'],
        'classes' => ['view', 'create', 'update', 'delete'],
        'attendance' => ['view', 'mark', 'create', 'update', 'delete', 'import', 'export', 'download-layout'],
        'grade-periods' => ['view', 'create', 'update', 'delete'],
        'grades' => ['view', 'create', 'update', 'delete', 'import', 'export', 'download-layout'],
        'homework' => ['view', 'create', 'update', 'delete'],
        'homework-submissions' => ['view', 'create', 'update', 'delete'],
        'lesson-plans' => ['view', 'create', 'update', 'delete'],
        'fee' => ['view', 'create', 'update', 'delete'],
        'fee-payments' => ['create'],
        'expenses' => ['view', 'create', 'update', 'delete'],
        'expense-categories' => ['view', 'create', 'update', 'delete'],
        'exam' => ['view', 'create', 'update', 'delete'],
        'exam-results' => ['view', 'create', 'update', 'delete'],
        'reports' => ['view'],
        'certificates' => ['view', 'create', 'update', 'delete'],
        'honor-roll' => ['view'],
        'notifications' => ['view', 'create', 'update', 'delete', 'mark-read', 'mark-all-read'],
        'activity-logs' => ['view', 'create', 'update', 'delete'],
        'users' => ['view', 'create', 'update', 'delete'],
        'roles' => ['view', 'create', 'update', 'delete'],
        'permissions' => ['view', 'create', 'update', 'delete'],
        'settings' => ['view', 'update'],
        'translations' => ['view', 'create', 'update', 'delete'],
        'sidebar' => ['view', 'update'],
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

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
