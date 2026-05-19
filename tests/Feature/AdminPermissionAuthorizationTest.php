<?php

namespace Tests\Feature;

use App\Models\FeeCharge;
use App\Models\GradeRecord;
use App\Models\Level;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminPermissionAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_permission_seeder_contains_every_route_permission_used_by_admin_routes(): void
    {
        $this->seed(PermissionSeeder::class);

        foreach ($this->adminRoutePermissions() as $permission) {
            $this->assertDatabaseHas('permissions', [
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }
    }

    public function test_default_student_role_has_read_permissions_without_admin_write_permissions(): void
    {
        $this->seed(PermissionSeeder::class);
        $this->seed(RoleSeeder::class);

        $studentRole = Role::query()->where('name', 'student')->firstOrFail();

        foreach ([
            'dashboard.view',
            'grades.view',
            'homework.view',
            'homework-submissions.create',
            'notifications.mark-read',
        ] as $permission) {
            $this->assertTrue($studentRole->hasPermissionTo($permission), "Student role should have {$permission}.");
        }

        foreach ([
            'students.create',
            'students.update',
            'students.delete',
            'teachers.update',
            'classes.delete',
            'grades.update',
            'grades.delete',
            'fee.create',
            'fee.update',
            'fee.delete',
            'users.view',
            'roles.view',
            'permissions.view',
            'settings.update',
        ] as $permission) {
            $this->assertFalse($studentRole->hasPermissionTo($permission), "Student role should not have {$permission}.");
        }
    }

    public function test_student_role_is_forbidden_from_admin_write_routes(): void
    {
        $this->seed(PermissionSeeder::class);
        $this->seed(RoleSeeder::class);

        $studentUser = User::factory()->create();
        $studentUser->syncRoles([Role::query()->where('name', 'student')->firstOrFail()]);

        $this->be($studentUser);

        $routes = [
            ['PUT', 'admin.levels.update', Level::factory()->create()],
            ['DELETE', 'admin.students.destroy', Student::factory()->create()],
            ['PUT', 'admin.teachers.update', Teacher::factory()->create()],
            ['DELETE', 'admin.grades.destroy', GradeRecord::factory()->create()],
            ['PUT', 'admin.fee.update', FeeCharge::factory()->create()],
        ];

        foreach ($routes as [$method, $routeName, $routeParameter]) {
            $this
                ->call($method, route($routeName, $routeParameter))
                ->assertForbidden();
        }
    }

    /**
     * @return array<int, string>
     */
    private function adminRoutePermissions(): array
    {
        return [
            'dashboard.view',
            'levels.view',
            'levels.create',
            'levels.update',
            'levels.delete',
            'students.view',
            'students.show',
            'students.create',
            'students.update',
            'students.delete',
            'students.import',
            'students.export',
            'students.download-layout',
            'teachers.view',
            'teachers.show',
            'teachers.create',
            'teachers.update',
            'teachers.delete',
            'teachers.import',
            'teachers.export',
            'teachers.download-layout',
            'teacher-lesson-plans.create',
            'teacher-grades.view',
            'teacher-grades.update',
            'classes.view',
            'classes.create',
            'classes.update',
            'classes.delete',
            'attendance.view',
            'attendance.mark',
            'attendance.create',
            'attendance.update',
            'attendance.delete',
            'attendance.import',
            'attendance.export',
            'attendance.download-layout',
            'grades.view',
            'grades.create',
            'grades.update',
            'grades.delete',
            'grades.import',
            'grades.export',
            'grades.download-layout',
            'homework.view',
            'homework.create',
            'homework.update',
            'homework.delete',
            'homework-submissions.view',
            'homework-submissions.create',
            'homework-submissions.update',
            'homework-submissions.delete',
            'lesson-plans.view',
            'lesson-plans.create',
            'lesson-plans.update',
            'lesson-plans.delete',
            'fee.view',
            'fee.create',
            'fee.update',
            'fee.delete',
            'fee-payments.create',
            'expenses.view',
            'expenses.create',
            'expenses.update',
            'expenses.delete',
            'expense-categories.create',
            'expense-categories.update',
            'expense-categories.delete',
            'exam.view',
            'exam.create',
            'exam.update',
            'exam.delete',
            'exam-results.view',
            'exam-results.create',
            'exam-results.update',
            'exam-results.delete',
            'reports.view',
            'honor-roll.view',
            'certificates.view',
            'certificates.create',
            'certificates.update',
            'certificates.delete',
            'notifications.view',
            'notifications.create',
            'notifications.update',
            'notifications.delete',
            'notifications.mark-read',
            'notifications.mark-all-read',
            'activity-logs.view',
            'activity-logs.create',
            'activity-logs.update',
            'activity-logs.delete',
            'users.view',
            'users.create',
            'users.update',
            'users.delete',
            'roles.view',
            'roles.create',
            'roles.update',
            'roles.delete',
            'permissions.view',
            'permissions.create',
            'permissions.update',
            'permissions.delete',
            'settings.view',
            'settings.update',
        ];
    }
}
