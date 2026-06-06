<?php

use App\Http\Controllers\Backends\ActivityLogController;
use App\Http\Controllers\Backends\AttendanceSessionController;
use App\Http\Controllers\Backends\CertificateController;
use App\Http\Controllers\Backends\DashboardController;
use App\Http\Controllers\Backends\ExamController;
use App\Http\Controllers\Backends\ExamResultController;
use App\Http\Controllers\Backends\ExpenseController;
use App\Http\Controllers\Backends\FeeChargeController;
use App\Http\Controllers\Backends\GradeRecordController;
use App\Http\Controllers\Backends\HomeworkAssignmentController;
use App\Http\Controllers\Backends\HomeworkSubmissionController;
use App\Http\Controllers\Backends\LessonPlanController;
use App\Http\Controllers\Backends\LevelController;
use App\Http\Controllers\Backends\NotificationController;
use App\Http\Controllers\Backends\ReportController;
use App\Http\Controllers\Backends\RolePermissionController;
use App\Http\Controllers\Backends\SchoolClassController;
use App\Http\Controllers\Backends\SchoolSettingController;
use App\Http\Controllers\Backends\StudentController;
use App\Http\Controllers\Backends\TeacherController;
use App\Http\Controllers\Backends\TeacherGradeController;
use App\Http\Controllers\Backends\UserController;
use App\Http\Controllers\Parent\ParentAccessController;
use App\Http\Controllers\Parent\ParentPortalController;
use App\Http\Controllers\Parent\ParentPwaController;
use App\Http\Controllers\Student\StudentPortalController;
use App\Http\Controllers\Student\StudentPushSubscriptionController;
use App\Http\Controllers\Student\StudentPwaController;
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
use App\Support\RoleRedirect;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

Route::get('/', function (Request $request) {
    $user = $request->user() ?? auth()->user();

    if ($user) {
        return redirect()->to(RoleRedirect::defaultPathFor($user));
    }

    return Inertia::render('auth/login', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])
        ->middleware('can:viewDashboard')
        ->name('dashboard');
});

// Admin School Management
Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', fn () => redirect()->route('dashboard'));
    Route::get('/dashboard', fn () => redirect()->route('dashboard'))->name('dashboard');

    // Levels
    Route::prefix('levels')->group(function () {
        Route::get('/', [LevelController::class, 'index'])->can('view', Level::class)->name('levels');
        Route::post('/', [LevelController::class, 'store'])->can('create', Level::class)->name('levels.store');
        Route::put('/{level}', [LevelController::class, 'update'])->can('update', 'level')->name('levels.update');
        Route::delete('/{level}', [LevelController::class, 'destroy'])->can('delete', 'level')->name('levels.destroy');
    });

    // Students
    Route::prefix('students')->group(function () {
        Route::get('/layout', [StudentController::class, 'downloadLayout'])->can('downloadLayout', Student::class)->name('students.layout');
        Route::post('/import', [StudentController::class, 'import'])->can('import', Student::class)->name('students.import');
        Route::get('/export', [StudentController::class, 'export'])->can('export', Student::class)->name('students.export');
        Route::get('/create', [StudentController::class, 'create'])->can('create', Student::class)->name('students.create');
        Route::get('/', [StudentController::class, 'index'])->can('view', Student::class)->name('students');
        Route::post('/', [StudentController::class, 'store'])->can('create', Student::class)->name('students.store');
        Route::get('/{student}/edit', [StudentController::class, 'edit'])->can('update', 'student')->name('students.edit');
        Route::get('/{student}', [StudentController::class, 'show'])->can('show', 'student')->name('students.show');
        Route::put('/{student}', [StudentController::class, 'update'])->can('update', 'student')->name('students.update');
        Route::delete('/{student}', [StudentController::class, 'destroy'])->can('delete', 'student')->name('students.destroy');
    });

    // Teachers
    Route::prefix('teachers')->group(function () {
        Route::get('/layout', [TeacherController::class, 'downloadLayout'])->can('downloadLayout', Teacher::class)->name('teachers.layout');
        Route::post('/import', [TeacherController::class, 'import'])->can('import', Teacher::class)->name('teachers.import');
        Route::get('/export', [TeacherController::class, 'export'])->can('export', Teacher::class)->name('teachers.export');
        Route::get('/{teacher}/lesson-plans/create', [TeacherController::class, 'createLessonPlan'])->can('createLessonPlan', 'teacher')->name('teachers.lesson-plans.create');
        Route::post('/{teacher}/lesson-plans', [TeacherController::class, 'storeLessonPlan'])->can('createLessonPlan', 'teacher')->name('teachers.lesson-plans.store');
        Route::get('/{teacher}/grades', [TeacherGradeController::class, 'index'])->can('viewGrades', 'teacher')->name('teachers.grades');
        Route::post('/{teacher}/grades', [TeacherGradeController::class, 'store'])->can('updateGrades', 'teacher')->name('teachers.grades.store');
        Route::get('/', [TeacherController::class, 'index'])->can('view', Teacher::class)->name('teachers');
        Route::post('/', [TeacherController::class, 'store'])->can('create', Teacher::class)->name('teachers.store');
        Route::get('/{teacher}', [TeacherController::class, 'show'])->can('show', 'teacher')->name('teachers.show');
        Route::put('/{teacher}', [TeacherController::class, 'update'])->can('update', 'teacher')->name('teachers.update');
        Route::delete('/{teacher}', [TeacherController::class, 'destroy'])->can('delete', 'teacher')->name('teachers.destroy');
    });

    // Classes
    Route::prefix('classes')->group(function () {
        Route::get('/', [SchoolClassController::class, 'index'])->can('view', SchoolClass::class)->name('classes');
        Route::post('/', [SchoolClassController::class, 'store'])->can('create', SchoolClass::class)->name('classes.store');
        Route::put('/{schoolClass}', [SchoolClassController::class, 'update'])->can('update', 'schoolClass')->name('classes.update');
        Route::delete('/{schoolClass}', [SchoolClassController::class, 'destroy'])->can('delete', 'schoolClass')->name('classes.destroy');
    });

    // Attendance
    Route::prefix('attendance')->group(function () {
        Route::get('/layout', [AttendanceSessionController::class, 'downloadLayout'])->can('downloadLayout', AttendanceSession::class)->name('attendance.layout');
        Route::post('/import', [AttendanceSessionController::class, 'import'])->can('import', AttendanceSession::class)->name('attendance.import');
        Route::get('/export', [AttendanceSessionController::class, 'export'])->can('export', AttendanceSession::class)->name('attendance.export');
        Route::get('/mark', [AttendanceSessionController::class, 'create'])->can('mark', AttendanceSession::class)->name('attendance.mark');
        Route::get('/{attendanceSession}/edit', [AttendanceSessionController::class, 'edit'])->can('update', 'attendanceSession')->name('attendance.edit');
        Route::get('/', [AttendanceSessionController::class, 'index'])->can('view', AttendanceSession::class)->name('attendance');
        Route::post('/', [AttendanceSessionController::class, 'store'])->can('create', AttendanceSession::class)->name('attendance.store');
        Route::put('/{attendanceSession}', [AttendanceSessionController::class, 'update'])->can('update', 'attendanceSession')->name('attendance.update');
        Route::delete('/{attendanceSession}', [AttendanceSessionController::class, 'destroy'])->can('delete', 'attendanceSession')->name('attendance.destroy');
    });

    // Grades
    Route::prefix('grades')->group(function () {
        Route::get('/layout', [GradeRecordController::class, 'downloadLayout'])->can('downloadLayout', GradeRecord::class)->name('grades.layout');
        Route::post('/import', [GradeRecordController::class, 'import'])->can('import', GradeRecord::class)->name('grades.import');
        Route::get('/export', [GradeRecordController::class, 'export'])->can('export', GradeRecord::class)->name('grades.export');
        Route::get('/', [GradeRecordController::class, 'index'])->can('view', GradeRecord::class)->name('grades');
        Route::post('/', [GradeRecordController::class, 'store'])->can('create', GradeRecord::class)->name('grades.store');
        Route::put('/{gradeRecord}', [GradeRecordController::class, 'update'])->can('update', 'gradeRecord')->name('grades.update');
        Route::delete('/{gradeRecord}', [GradeRecordController::class, 'destroy'])->can('delete', 'gradeRecord')->name('grades.destroy');
    });

    // Homework Assignments
    Route::prefix('homework')->group(function () {
        Route::get('/create', [HomeworkAssignmentController::class, 'create'])->can('create', HomeworkAssignment::class)->name('homework.create');
        Route::get('/{homeworkAssignment}/edit', [HomeworkAssignmentController::class, 'edit'])->can('update', 'homeworkAssignment')->name('homework.edit');
        Route::get('/', [HomeworkAssignmentController::class, 'index'])->can('view', HomeworkAssignment::class)->name('homework');
        Route::post('/', [HomeworkAssignmentController::class, 'store'])->can('create', HomeworkAssignment::class)->name('homework.store');
        Route::put('/{homeworkAssignment}', [HomeworkAssignmentController::class, 'update'])->can('update', 'homeworkAssignment')->name('homework.update');
        Route::delete('/{homeworkAssignment}', [HomeworkAssignmentController::class, 'destroy'])->can('delete', 'homeworkAssignment')->name('homework.destroy');
    });

    // Lesson Plans
    Route::prefix('lesson-plans')->group(function () {
        Route::get('/create', [LessonPlanController::class, 'create'])->can('create', LessonPlan::class)->name('lesson-plans.create');
        Route::get('/{lessonPlan}/edit', [LessonPlanController::class, 'edit'])->can('update', 'lessonPlan')->name('lesson-plans.edit');
        Route::get('/', [LessonPlanController::class, 'index'])->can('view', LessonPlan::class)->name('lesson-plans');
        Route::post('/', [LessonPlanController::class, 'store'])->can('create', LessonPlan::class)->name('lesson-plans.store');
        Route::put('/{lessonPlan}', [LessonPlanController::class, 'update'])->can('update', 'lessonPlan')->name('lesson-plans.update');
        Route::delete('/{lessonPlan}', [LessonPlanController::class, 'destroy'])->can('delete', 'lessonPlan')->name('lesson-plans.destroy');
    });

    // Homework Submissions
    Route::prefix('homework-submissions')->group(function () {
        Route::get('/alerts', [HomeworkSubmissionController::class, 'alerts'])->can('view', HomeworkSubmission::class)->name('homework-submissions.alerts');
        Route::get('/create', [HomeworkSubmissionController::class, 'create'])->can('create', HomeworkSubmission::class)->name('homework-submissions.create');
        Route::get('/', [HomeworkSubmissionController::class, 'index'])->can('view', HomeworkSubmission::class)->name('homework-submissions');
        Route::post('/', [HomeworkSubmissionController::class, 'store'])->can('create', HomeworkSubmission::class)->name('homework-submissions.store');
        Route::put('/{homeworkSubmission}', [HomeworkSubmissionController::class, 'update'])->can('update', 'homeworkSubmission')->name('homework-submissions.update');
        Route::delete('/{homeworkSubmission}', [HomeworkSubmissionController::class, 'destroy'])->can('delete', 'homeworkSubmission')->name('homework-submissions.destroy');
    });

    // Fee Charges
    Route::prefix('fee')->group(function () {
        Route::get('/create', [FeeChargeController::class, 'create'])->can('create', FeeCharge::class)->name('fee.create');
        Route::get('/{feeCharge}/edit', [FeeChargeController::class, 'edit'])->can('update', 'feeCharge')->name('fee.edit');
        Route::get('/', [FeeChargeController::class, 'index'])->can('view', FeeCharge::class)->name('fee');
        Route::post('/', [FeeChargeController::class, 'store'])->can('create', FeeCharge::class)->name('fee.store');
        Route::put('/{feeCharge}', [FeeChargeController::class, 'update'])->can('update', 'feeCharge')->name('fee.update');
        Route::delete('/{feeCharge}', [FeeChargeController::class, 'destroy'])->can('delete', 'feeCharge')->name('fee.destroy');
        Route::post('/{feeCharge}/payments', [FeeChargeController::class, 'payment'])->can('payment', 'feeCharge')->name('fee.payments.store');
    });

    // Expenses
    Route::prefix('expenses')->group(function () {
        Route::get('/', [ExpenseController::class, 'index'])->can('viewAny', Expense::class)->name('expenses');
        Route::post('/', [ExpenseController::class, 'store'])->can('create', Expense::class)->name('expenses.store');
        Route::put('/{expense}', [ExpenseController::class, 'update'])->can('update', 'expense')->name('expenses.update');
        Route::delete('/{expense}', [ExpenseController::class, 'destroy'])->can('delete', 'expense')->name('expenses.destroy');
    });

    // Expense Categories
    Route::prefix('expense-categories')->group(function () {
        Route::post('/', [ExpenseController::class, 'storeCategory'])->can('create', ExpenseCategory::class)->name('expense-categories.store');
        Route::put('/{expenseCategory}', [ExpenseController::class, 'updateCategory'])->can('update', 'expenseCategory')->name('expense-categories.update');
        Route::delete('/{expenseCategory}', [ExpenseController::class, 'destroyCategory'])->can('delete', 'expenseCategory')->name('expense-categories.destroy');
    });

    // Exams
    Route::prefix('exam')->group(function () {
        Route::get('/', [ExamController::class, 'index'])->can('view', Exam::class)->name('exam');
        Route::post('/', [ExamController::class, 'store'])->can('create', Exam::class)->name('exam.store');
        Route::put('/{exam}', [ExamController::class, 'update'])->can('update', 'exam')->name('exam.update');
        Route::delete('/{exam}', [ExamController::class, 'destroy'])->can('delete', 'exam')->name('exam.destroy');
    });

    // Exam Results
    Route::prefix('exam-results')->group(function () {
        Route::get('/', [ExamResultController::class, 'index'])->can('view', ExamResult::class)->name('exam-results');
        Route::post('/', [ExamResultController::class, 'store'])->can('create', ExamResult::class)->name('exam-results.store');
        Route::put('/{examResult}', [ExamResultController::class, 'update'])->can('update', 'examResult')->name('exam-results.update');
        Route::delete('/{examResult}', [ExamResultController::class, 'destroy'])->can('delete', 'examResult')->name('exam-results.destroy');
    });

    // Reports / Honor Roll
    Route::get('/reports', [ReportController::class, 'index'])->middleware('can:viewReports')->name('reports');
    Route::get('/honor-roll', fn () => Inertia::render('admin/honor-roll/index'))->middleware('can:viewHonorRoll')->name('honor-roll');

    // Certificates
    Route::prefix('certs')->group(function () {
        Route::get('/', [CertificateController::class, 'index'])->can('view', Certificate::class)->name('certs');
        Route::get('/create', [CertificateController::class, 'create'])->can('create', Certificate::class)->name('certs.create');
        Route::get('/templates/create', [CertificateController::class, 'createTemplate'])->can('create', Certificate::class)->name('certs.templates.create');
        Route::post('/templates', [CertificateController::class, 'storeTemplate'])->can('create', Certificate::class)->name('certs.templates.store');
        Route::put('/templates/{certificateTemplate}', [CertificateController::class, 'updateTemplate'])->can('update', Certificate::class)->name('certs.templates.update');
        Route::delete('/templates/{certificateTemplate}', [CertificateController::class, 'destroyTemplate'])->can('delete', Certificate::class)->name('certs.templates.destroy');
        Route::post('/', [CertificateController::class, 'store'])->can('create', Certificate::class)->name('certs.store');
        Route::put('/{certificate}', [CertificateController::class, 'update'])->can('update', 'certificate')->name('certs.update');
        Route::delete('/{certificate}', [CertificateController::class, 'destroy'])->can('delete', 'certificate')->name('certs.destroy');
    });

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::put('/read', [NotificationController::class, 'markAllRead'])->can('markAllRead', Notification::class)->name('notifications.read-all');
        Route::get('/', [NotificationController::class, 'index'])->can('view', Notification::class)->name('notifications');
        Route::post('/', [NotificationController::class, 'store'])->can('create', Notification::class)->name('notifications.store');
        Route::put('/{notification}', [NotificationController::class, 'update'])->can('update', 'notification')->name('notifications.update');
        Route::put('/{notification}/read', [NotificationController::class, 'markRead'])->can('markRead', 'notification')->name('notifications.read');
        Route::delete('/{notification}', [NotificationController::class, 'destroy'])->can('delete', 'notification')->name('notifications.destroy');
    });

    // Activity Logs
    Route::prefix('activity-logs')->group(function () {
        Route::get('/', [ActivityLogController::class, 'index'])->can('view', ActivityLog::class)->name('activity-logs');
        Route::post('/', [ActivityLogController::class, 'store'])->can('create', ActivityLog::class)->name('activity-logs.store');
        Route::put('/{activityLog}', [ActivityLogController::class, 'update'])->can('update', 'activityLog')->name('activity-logs.update');
        Route::delete('/{activityLog}', [ActivityLogController::class, 'destroy'])->can('delete', 'activityLog')->name('activity-logs.destroy');
    });

    // Users
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index'])->can('view', User::class)->name('users');
        Route::post('/', [UserController::class, 'store'])->can('create', User::class)->name('users.store');
        Route::put('/{user}', [UserController::class, 'update'])->can('update', 'user')->name('users.update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->can('delete', 'user')->name('users.destroy');
    });

    // Roles & Permissions
    Route::get('/roles-permissions', [RolePermissionController::class, 'index'])
        ->middleware('can:viewRolesPermissions')
        ->name('roles-permissions');

    Route::prefix('roles')->group(function () {
        Route::post('/', [RolePermissionController::class, 'storeRole'])->can('create', Role::class)->name('roles.store');
        Route::put('/{role}', [RolePermissionController::class, 'updateRole'])->can('update', 'role')->name('roles.update');
        Route::delete('/{role}', [RolePermissionController::class, 'destroyRole'])->can('delete', 'role')->name('roles.destroy');
    });

    Route::prefix('permissions')->group(function () {
        Route::post('/', [RolePermissionController::class, 'storePermission'])->can('create', Permission::class)->name('permissions.store');
        Route::put('/{permission}', [RolePermissionController::class, 'updatePermission'])->can('update', 'permission')->name('permissions.update');
        Route::delete('/{permission}', [RolePermissionController::class, 'destroyPermission'])->can('delete', 'permission')->name('permissions.destroy');
    });

    // Settings
    Route::prefix('settings')->group(function () {
        Route::get('/', [SchoolSettingController::class, 'index'])->can('view', SchoolSetting::class)->name('settings');
        Route::put('/{group}', [SchoolSettingController::class, 'update'])->can('update', SchoolSetting::class)->name('settings.update');
        Route::post('/upload-image', [SchoolSettingController::class, 'uploadImage'])->can('update', SchoolSetting::class)->name('settings.upload-image');
        Route::post('/search-console-file', [SchoolSettingController::class, 'uploadSearchConsoleFile'])->can('update', SchoolSetting::class)->name('settings.search-console-file');
    });
});

// Parent Portal PWA
Route::prefix('parent')->name('parent.')->controller(ParentPwaController::class)->group(function () {
    Route::get('/manifest.webmanifest', 'manifest')->name('manifest');
    Route::get('/service-worker.js', 'serviceWorker')->name('service-worker');
    Route::get('/offline', 'offline')->name('offline');
});

// Parent Portal
Route::prefix('parent')->name('parent.')->group(function () {
    Route::redirect('/', '/parent/dashboard')->name('home');
    Route::post('/access-link', [ParentAccessController::class, 'sendLink'])->name('access-link');
    Route::get('/access/{token}', [ParentAccessController::class, 'verify'])->name('access.verify');
    Route::get('/dashboard', [ParentPortalController::class, 'dashboard'])->name('dashboard');
});

// Student Portal PWA
Route::prefix('student')->name('student.')->controller(StudentPwaController::class)->group(function () {
    Route::get('/manifest.webmanifest', 'manifest')->name('manifest');
    Route::get('/service-worker.js', 'serviceWorker')->name('service-worker');
    Route::get('/offline', 'offline')->name('offline');
});

// Student Portal Student
Route::middleware(['auth', 'verified'])->prefix('student')->name('student.')->group(function () {
    Route::get('/push-notifications/public-key', [StudentPushSubscriptionController::class, 'publicKey'])->name('push-notifications.public-key');
    Route::post('/push-notifications/subscriptions', [StudentPushSubscriptionController::class, 'store'])->name('push-notifications.subscriptions.store');
    Route::delete('/push-notifications/subscriptions', [StudentPushSubscriptionController::class, 'destroy'])->name('push-notifications.subscriptions.destroy');
    Route::get('/push-notifications/latest', [StudentPushSubscriptionController::class, 'latest'])->name('push-notifications.latest');

    Route::get('/dashboard', [StudentPortalController::class, 'dashboard'])->name('dashboard');
    Route::get('/attendance', [StudentPortalController::class, 'attendance'])->name('attendance');
    Route::get('/grades', [StudentPortalController::class, 'grades'])->name('grades');
    Route::get('/homework', [StudentPortalController::class, 'homework'])->name('homework');
    Route::post('/homework/{homeworkAssignment}/submit', [StudentPortalController::class, 'submitHomework'])->name('homework.submit');
    Route::get('/fees', [StudentPortalController::class, 'fees'])->name('fees');
    Route::get('/exams', [StudentPortalController::class, 'exams'])->name('exams');
    Route::get('/exams/{exam}', [StudentPortalController::class, 'examShow'])->name('exams.show');
    Route::get('/exam-results', [StudentPortalController::class, 'examResults'])->name('exam-results');
    Route::get('/class-schedule', [StudentPortalController::class, 'classSchedule'])->name('class-schedule');
    Route::get('/learning-materials', [StudentPortalController::class, 'learningMaterials'])->name('learning-materials');
    Route::get('/attendance-calendar', [StudentPortalController::class, 'attendanceCalendar'])->name('attendance-calendar');
    Route::get('/homework-calendar', [StudentPortalController::class, 'homeworkCalendar'])->name('homework-calendar');
    Route::get('/id-card', [StudentPortalController::class, 'idCard'])->name('id-card');
    Route::get('/certificates', [StudentPortalController::class, 'certificates'])->name('certificates');
    Route::put('/notifications/read', [StudentPortalController::class, 'markNotificationsRead'])->name('notifications.read');
    Route::get('/notifications', [StudentPortalController::class, 'notifications'])->name('notifications');
    Route::get('/notifications/{notification}', [StudentPortalController::class, 'notificationShow'])->name('notifications.show');
    Route::get('/profile', [StudentPortalController::class, 'profile'])->name('profile');
});

require __DIR__.'/settings.php';
