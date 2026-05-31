<?php

namespace App\Providers;

use App\Models\ActivityLog;
use App\Models\AttendanceSession;
use App\Models\Certificate;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Expense;
use App\Models\ExpenseCategory;
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
use App\Policies\FeaturePermissionPolicy;
use App\Support\EncryptedRouteKey;
use App\Support\SchoolProfile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Share school data with the root blade for favicon and OG meta tags
        View::composer('app', function (\Illuminate\View\View $view): void {
            $value = app(SchoolProfile::class)->data();
            $seo = SchoolSetting::query()
                ->where('group', 'seo')
                ->where('key', 'meta')
                ->first()?->value ?? [];

            $view->with('schoolFavicon', $value['favicon']);
            $view->with('schoolLogo', $value['logo']);
            $view->with('schoolName', $value['nameEn'] ?? config('app.name', 'School System'));
            $view->with('seoTitle', $seo['title'] ?? $value['nameEn'] ?? config('app.name', 'School System'));
            $view->with('seoDescription', $seo['description'] ?? ($value['nameEn'] ?? config('app.name', 'School System')).' - School Management System');
            $view->with('seoKeywords', $seo['keywords'] ?? null);
            $view->with('seoCanonicalUrl', $seo['canonicalUrl'] ?? null);
            $view->with('seoRobots', $seo['robots'] ?? 'index,follow');
            $view->with('seoImage', filled(Arr::get($seo, 'seoImage')) ? asset((string) Arr::get($seo, 'seoImage')) : null);
        });

        $policyModels = [
            Level::class,
            Student::class,
            Teacher::class,
            SchoolClass::class,
            AttendanceSession::class,
            GradeRecord::class,
            HomeworkAssignment::class,
            HomeworkSubmission::class,
            LessonPlan::class,
            Expense::class,
            ExpenseCategory::class,
            FeeCharge::class,
            Exam::class,
            ExamResult::class,
            Certificate::class,
            Notification::class,
            ActivityLog::class,
            User::class,
            Role::class,
            Permission::class,
            SchoolSetting::class,
        ];

        foreach ($policyModels as $modelClass) {
            Gate::policy($modelClass, FeaturePermissionPolicy::class);
        }

        Gate::define('viewDashboard', fn ($user): bool => $user->can('dashboard.view'));
        Gate::define('viewReports', fn ($user): bool => $user->can('reports.view'));
        Gate::define('viewHonorRoll', fn ($user): bool => $user->can('honor-roll.view'));
        Gate::define('viewRolesPermissions', fn ($user): bool => $user->can('roles.view') && $user->can('permissions.view'));

        Route::bind('role', function (string $value): Role {
            $key = EncryptedRouteKey::decrypt($value);

            abort_if($key === null, 404);

            return Role::query()->whereKey($key)->firstOrFail();
        });

        Route::bind('permission', function (string $value): Permission {
            $key = EncryptedRouteKey::decrypt($value);

            abort_if($key === null, 404);

            return Permission::query()->whereKey($key)->firstOrFail();
        });
    }
}
