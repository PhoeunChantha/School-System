<?php

namespace App\Policies;

use App\Models\ActivityLog;
use App\Models\AttendanceSession;
use App\Models\Certificate;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\FeeCharge;
use App\Models\GradeRecord;
use App\Models\HomeworkAssignment;
use App\Models\HomeworkSubmission;
use App\Models\LessonPlan;
use App\Models\Level;
use App\Models\Notification;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class FeaturePermissionPolicy
{
    /**
     * @var array<class-string, string>
     */
    private array $featureMap = [
        Level::class => 'levels',
        Student::class => 'students',
        Teacher::class => 'teachers',
        SchoolClass::class => 'classes',
        AttendanceSession::class => 'attendance',
        GradeRecord::class => 'grades',
        HomeworkAssignment::class => 'homework',
        HomeworkSubmission::class => 'homework-submissions',
        LessonPlan::class => 'lesson-plans',
        FeeCharge::class => 'fee',
        Exam::class => 'exam',
        ExamResult::class => 'exam-results',
        Certificate::class => 'certificates',
        Notification::class => 'notifications',
        ActivityLog::class => 'activity-logs',
        Role::class => 'roles',
        Permission::class => 'permissions',
        SchoolSetting::class => 'settings',
    ];

    /**
     * @var array<string, string>
     */
    private array $routeFeatureMap = [
        'levels' => 'levels',
        'students' => 'students',
        'teachers' => 'teachers',
        'classes' => 'classes',
        'attendance' => 'attendance',
        'grades' => 'grades',
        'homework' => 'homework',
        'homework-submissions' => 'homework-submissions',
        'lesson-plans' => 'lesson-plans',
        'fee' => 'fee',
        'exam' => 'exam',
        'exam-results' => 'exam-results',
        'certs' => 'certificates',
        'notifications' => 'notifications',
        'activity-logs' => 'activity-logs',
        'roles' => 'roles',
        'permissions' => 'permissions',
        'settings' => 'settings',
    ];

    public function view(User $user, mixed $subject = null): bool
    {
        return $this->allows($user, $subject, 'view');
    }

    public function show(User $user, mixed $subject = null): bool
    {
        return $this->allows($user, $subject, 'show');
    }

    public function create(User $user, mixed $subject = null): bool
    {
        return $this->allows($user, $subject, 'create');
    }

    public function update(User $user, mixed $subject = null): bool
    {
        return $this->allows($user, $subject, 'update');
    }

    public function delete(User $user, mixed $subject = null): bool
    {
        return $this->allows($user, $subject, 'delete');
    }

    public function import(User $user, mixed $subject = null): bool
    {
        return $this->allows($user, $subject, 'import');
    }

    public function export(User $user, mixed $subject = null): bool
    {
        return $this->allows($user, $subject, 'export');
    }

    public function downloadLayout(User $user, mixed $subject = null): bool
    {
        return $this->allows($user, $subject, 'download-layout');
    }

    public function mark(User $user, mixed $subject = null): bool
    {
        return $this->allows($user, $subject, 'mark');
    }

    public function markRead(User $user, mixed $subject = null): bool
    {
        return $this->allows($user, $subject, 'mark-read');
    }

    public function markAllRead(User $user, mixed $subject = null): bool
    {
        return $this->allows($user, $subject, 'mark-all-read');
    }

    public function payment(User $user, mixed $subject = null): bool
    {
        return $user->can('fee-payments.create');
    }

    public function createLessonPlan(User $user, mixed $subject = null): bool
    {
        return $user->can('teacher-lesson-plans.create');
    }

    public function viewGrades(User $user, mixed $subject = null): bool
    {
        return $user->can('teacher-grades.view');
    }

    public function updateGrades(User $user, mixed $subject = null): bool
    {
        return $user->can('teacher-grades.update');
    }

    private function allows(User $user, mixed $subject, string $action): bool
    {
        $feature = $this->feature($subject) ?? $this->featureFromRoute();

        if ($feature === null) {
            return false;
        }

        return $user->can("{$feature}.{$action}");
    }

    private function feature(mixed $subject): ?string
    {
        if ($subject === null) {
            return null;
        }

        $className = is_string($subject) ? $subject : $subject::class;

        return $this->featureMap[$className] ?? null;
    }

    private function featureFromRoute(): ?string
    {
        $routeName = request()->route()?->getName();

        if (! is_string($routeName)) {
            return null;
        }

        $routeKey = str($routeName)->after('admin.')->before('.')->toString();

        return $this->routeFeatureMap[$routeKey] ?? null;
    }
}
