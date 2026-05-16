<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    /**
     * @var array<string, array<int, string>>
     */
    private array $rolePermissions = [
        'teacher' => [
            'dashboard.view',
            'students.view',
            'students.show',
            'classes.view',
            'attendance.view',
            'attendance.mark',
            'attendance.create',
            'attendance.update',
            'grades.view',
            'grades.create',
            'grades.update',
            'teacher-grades.view',
            'teacher-grades.update',
            'homework.view',
            'homework.create',
            'homework.update',
            'homework-submissions.view',
            'homework-submissions.update',
            'lesson-plans.view',
            'lesson-plans.create',
            'lesson-plans.update',
            'teacher-lesson-plans.create',
            'exam.view',
            'exam.create',
            'exam.update',
            'exam-results.view',
            'exam-results.create',
            'exam-results.update',
            'certificates.view',
            'honor-roll.view',
            'notifications.view',
            'notifications.mark-read',
            'notifications.mark-all-read',
        ],
        'student' => [
            'dashboard.view',
            'attendance.view',
            'grades.view',
            'homework.view',
            'homework-submissions.view',
            'homework-submissions.create',
            'exam.view',
            'exam-results.view',
            'certificates.view',
            'honor-roll.view',
            'notifications.view',
            'notifications.mark-read',
            'notifications.mark-all-read',
        ],
    ];

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $adminRole = Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'web',
        ]);

        $teacherRole = Role::firstOrCreate([
            'name' => 'teacher',
            'guard_name' => 'web',
        ]);

        $studentRole = Role::firstOrCreate([
            'name' => 'student',
            'guard_name' => 'web',
        ]);

        $adminRole->syncPermissions(Permission::query()->pluck('name')->all());
        $teacherRole->syncPermissions($this->rolePermissions['teacher']);
        $studentRole->syncPermissions($this->rolePermissions['student']);

        $admin = User::query()->where('email', 'admin@frania.edu.kh')->first();

        if ($admin instanceof User) {
            $admin->syncRoles([$adminRole]);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
