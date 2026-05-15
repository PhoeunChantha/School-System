<?php

use App\Http\Controllers\Backends\ActivityLogController;
use App\Http\Controllers\Backends\AttendanceSessionController;
use App\Http\Controllers\Backends\CertificateController;
use App\Http\Controllers\Backends\DashboardController;
use App\Http\Controllers\Backends\ExamController;
use App\Http\Controllers\Backends\ExamResultController;
use App\Http\Controllers\Backends\FeeChargeController;
use App\Http\Controllers\Backends\GradeRecordController;
use App\Http\Controllers\Backends\HomeworkAssignmentController;
use App\Http\Controllers\Backends\HomeworkSubmissionController;
use App\Http\Controllers\Backends\LessonPlanController;
use App\Http\Controllers\Backends\LevelController;
use App\Http\Controllers\Backends\NotificationController;
use App\Http\Controllers\Backends\RolePermissionController;
use App\Http\Controllers\Backends\SchoolClassController;
use App\Http\Controllers\Backends\SchoolSettingController;
use App\Http\Controllers\Backends\StudentController;
use App\Http\Controllers\Backends\TeacherController;
use App\Http\Controllers\Backends\TeacherGradeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])
        ->middleware('can:viewDashboard')
        ->name('dashboard');
});

// ── Admin School Management ──
Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', fn () => redirect()->route('dashboard'));
    Route::get('/dashboard', fn () => redirect()->route('dashboard'))->name('dashboard');
    Route::get('/levels', [LevelController::class, 'index'])->middleware('can:view,App\Models\Level')->name('levels');
    Route::post('/levels', [LevelController::class, 'store'])->middleware('can:create,App\Models\Level')->name('levels.store');
    Route::put('/levels/{level}', [LevelController::class, 'update'])->middleware('can:update,level')->name('levels.update');
    Route::delete('/levels/{level}', [LevelController::class, 'destroy'])->middleware('can:delete,level')->name('levels.destroy');
    Route::get('/students', [StudentController::class, 'index'])->middleware('can:view,App\Models\Student')->name('students');
    Route::get('/students/create', [StudentController::class, 'create'])->middleware('can:create,App\Models\Student')->name('students.create');
    Route::get('/students/layout', [StudentController::class, 'downloadLayout'])->middleware('can:downloadLayout,App\Models\Student')->name('students.layout');
    Route::post('/students/import', [StudentController::class, 'import'])->middleware('can:import,App\Models\Student')->name('students.import');
    Route::get('/students/export', [StudentController::class, 'export'])->middleware('can:export,App\Models\Student')->name('students.export');
    Route::post('/students', [StudentController::class, 'store'])->middleware('can:create,App\Models\Student')->name('students.store');
    Route::get('/students/{student}', [StudentController::class, 'show'])->middleware('can:show,student')->name('students.show');
    Route::get('/students/{student}/edit', [StudentController::class, 'edit'])->middleware('can:update,student')->name('students.edit');
    Route::put('/students/{student}', [StudentController::class, 'update'])->middleware('can:update,student')->name('students.update');
    Route::delete('/students/{student}', [StudentController::class, 'destroy'])->middleware('can:delete,student')->name('students.destroy');
    Route::get('/teachers', [TeacherController::class, 'index'])->middleware('can:view,App\Models\Teacher')->name('teachers');
    Route::get('/teachers/layout', [TeacherController::class, 'downloadLayout'])->middleware('can:downloadLayout,App\Models\Teacher')->name('teachers.layout');
    Route::post('/teachers/import', [TeacherController::class, 'import'])->middleware('can:import,App\Models\Teacher')->name('teachers.import');
    Route::get('/teachers/export', [TeacherController::class, 'export'])->middleware('can:export,App\Models\Teacher')->name('teachers.export');
    Route::get('/teachers/{teacher}/lesson-plans/create', [TeacherController::class, 'createLessonPlan'])->middleware('can:createLessonPlan,teacher')->name('teachers.lesson-plans.create');
    Route::post('/teachers/{teacher}/lesson-plans', [TeacherController::class, 'storeLessonPlan'])->middleware('can:createLessonPlan,teacher')->name('teachers.lesson-plans.store');
    Route::get('/teachers/{teacher}/grades', [TeacherGradeController::class, 'index'])->middleware('can:viewGrades,teacher')->name('teachers.grades');
    Route::post('/teachers/{teacher}/grades', [TeacherGradeController::class, 'store'])->middleware('can:updateGrades,teacher')->name('teachers.grades.store');
    Route::get('/teachers/{teacher}', [TeacherController::class, 'show'])->middleware('can:show,teacher')->name('teachers.show');
    Route::post('/teachers', [TeacherController::class, 'store'])->middleware('can:create,App\Models\Teacher')->name('teachers.store');
    Route::put('/teachers/{teacher}', [TeacherController::class, 'update'])->middleware('can:update,teacher')->name('teachers.update');
    Route::delete('/teachers/{teacher}', [TeacherController::class, 'destroy'])->middleware('can:delete,teacher')->name('teachers.destroy');
    Route::get('/classes', [SchoolClassController::class, 'index'])->middleware('can:view,App\Models\SchoolClass')->name('classes');
    Route::post('/classes', [SchoolClassController::class, 'store'])->middleware('can:create,App\Models\SchoolClass')->name('classes.store');
    Route::put('/classes/{schoolClass}', [SchoolClassController::class, 'update'])->middleware('can:update,schoolClass')->name('classes.update');
    Route::delete('/classes/{schoolClass}', [SchoolClassController::class, 'destroy'])->middleware('can:delete,schoolClass')->name('classes.destroy');
    Route::get('/attendance/mark', [AttendanceSessionController::class, 'create'])->middleware('can:mark,App\Models\AttendanceSession')->name('attendance.mark');
    Route::get('/attendance/layout', [AttendanceSessionController::class, 'downloadLayout'])->middleware('can:downloadLayout,App\Models\AttendanceSession')->name('attendance.layout');
    Route::post('/attendance/import', [AttendanceSessionController::class, 'import'])->middleware('can:import,App\Models\AttendanceSession')->name('attendance.import');
    Route::get('/attendance/export', [AttendanceSessionController::class, 'export'])->middleware('can:export,App\Models\AttendanceSession')->name('attendance.export');
    Route::get('/attendance/{attendanceSession}/edit', [AttendanceSessionController::class, 'edit'])->middleware('can:update,attendanceSession')->name('attendance.edit');
    Route::get('/attendance', [AttendanceSessionController::class, 'index'])->middleware('can:view,App\Models\AttendanceSession')->name('attendance');
    Route::post('/attendance', [AttendanceSessionController::class, 'store'])->middleware('can:create,App\Models\AttendanceSession')->name('attendance.store');
    Route::put('/attendance/{attendanceSession}', [AttendanceSessionController::class, 'update'])->middleware('can:update,attendanceSession')->name('attendance.update');
    Route::delete('/attendance/{attendanceSession}', [AttendanceSessionController::class, 'destroy'])->middleware('can:delete,attendanceSession')->name('attendance.destroy');
    Route::get('/grades', [GradeRecordController::class, 'index'])->middleware('can:view,App\Models\GradeRecord')->name('grades');
    Route::get('/grades/layout', [GradeRecordController::class, 'downloadLayout'])->middleware('can:downloadLayout,App\Models\GradeRecord')->name('grades.layout');
    Route::post('/grades/import', [GradeRecordController::class, 'import'])->middleware('can:import,App\Models\GradeRecord')->name('grades.import');
    Route::get('/grades/export', [GradeRecordController::class, 'export'])->middleware('can:export,App\Models\GradeRecord')->name('grades.export');
    Route::post('/grades', [GradeRecordController::class, 'store'])->middleware('can:create,App\Models\GradeRecord')->name('grades.store');
    Route::put('/grades/{gradeRecord}', [GradeRecordController::class, 'update'])->middleware('can:update,gradeRecord')->name('grades.update');
    Route::delete('/grades/{gradeRecord}', [GradeRecordController::class, 'destroy'])->middleware('can:delete,gradeRecord')->name('grades.destroy');
    Route::get('/homework', [HomeworkAssignmentController::class, 'index'])->middleware('can:view,App\Models\HomeworkAssignment')->name('homework');
    Route::get('/homework/create', [HomeworkAssignmentController::class, 'create'])->middleware('can:create,App\Models\HomeworkAssignment')->name('homework.create');
    Route::post('/homework', [HomeworkAssignmentController::class, 'store'])->middleware('can:create,App\Models\HomeworkAssignment')->name('homework.store');
    Route::get('/homework/{homeworkAssignment}/edit', [HomeworkAssignmentController::class, 'edit'])->middleware('can:update,homeworkAssignment')->name('homework.edit');
    Route::put('/homework/{homeworkAssignment}', [HomeworkAssignmentController::class, 'update'])->middleware('can:update,homeworkAssignment')->name('homework.update');
    Route::delete('/homework/{homeworkAssignment}', [HomeworkAssignmentController::class, 'destroy'])->middleware('can:delete,homeworkAssignment')->name('homework.destroy');
    Route::get('/lesson-plans/create', [LessonPlanController::class, 'create'])->middleware('can:create,App\Models\LessonPlan')->name('lesson-plans.create');
    Route::get('/lesson-plans/{lessonPlan}/edit', [LessonPlanController::class, 'edit'])->middleware('can:update,lessonPlan')->name('lesson-plans.edit');
    Route::get('/lesson-plans', [LessonPlanController::class, 'index'])->middleware('can:view,App\Models\LessonPlan')->name('lesson-plans');
    Route::post('/lesson-plans', [LessonPlanController::class, 'store'])->middleware('can:create,App\Models\LessonPlan')->name('lesson-plans.store');
    Route::put('/lesson-plans/{lessonPlan}', [LessonPlanController::class, 'update'])->middleware('can:update,lessonPlan')->name('lesson-plans.update');
    Route::delete('/lesson-plans/{lessonPlan}', [LessonPlanController::class, 'destroy'])->middleware('can:delete,lessonPlan')->name('lesson-plans.destroy');
    Route::get('/homework-submissions', [HomeworkSubmissionController::class, 'index'])->middleware('can:view,App\Models\HomeworkSubmission')->name('homework-submissions');
    Route::get('/homework-submissions/create', [HomeworkSubmissionController::class, 'create'])->middleware('can:create,App\Models\HomeworkSubmission')->name('homework-submissions.create');
    Route::post('/homework-submissions', [HomeworkSubmissionController::class, 'store'])->middleware('can:create,App\Models\HomeworkSubmission')->name('homework-submissions.store');
    Route::put('/homework-submissions/{homeworkSubmission}', [HomeworkSubmissionController::class, 'update'])->middleware('can:update,homeworkSubmission')->name('homework-submissions.update');
    Route::delete('/homework-submissions/{homeworkSubmission}', [HomeworkSubmissionController::class, 'destroy'])->middleware('can:delete,homeworkSubmission')->name('homework-submissions.destroy');
    Route::get('/fee', [FeeChargeController::class, 'index'])->middleware('can:view,App\Models\FeeCharge')->name('fee');
    Route::get('/fee/create', [FeeChargeController::class, 'create'])->middleware('can:create,App\Models\FeeCharge')->name('fee.create');
    Route::post('/fee', [FeeChargeController::class, 'store'])->middleware('can:create,App\Models\FeeCharge')->name('fee.store');
    Route::get('/fee/{feeCharge}/edit', [FeeChargeController::class, 'edit'])->middleware('can:update,feeCharge')->name('fee.edit');
    Route::put('/fee/{feeCharge}', [FeeChargeController::class, 'update'])->middleware('can:update,feeCharge')->name('fee.update');
    Route::delete('/fee/{feeCharge}', [FeeChargeController::class, 'destroy'])->middleware('can:delete,feeCharge')->name('fee.destroy');
    Route::post('/fee/{feeCharge}/payments', [FeeChargeController::class, 'payment'])->middleware('can:payment,feeCharge')->name('fee.payments.store');
    Route::get('/exam', [ExamController::class, 'index'])->middleware('can:view,App\Models\Exam')->name('exam');
    Route::post('/exam', [ExamController::class, 'store'])->middleware('can:create,App\Models\Exam')->name('exam.store');
    Route::put('/exam/{exam}', [ExamController::class, 'update'])->middleware('can:update,exam')->name('exam.update');
    Route::delete('/exam/{exam}', [ExamController::class, 'destroy'])->middleware('can:delete,exam')->name('exam.destroy');
    Route::get('/exam-results', [ExamResultController::class, 'index'])->middleware('can:view,App\Models\ExamResult')->name('exam-results');
    Route::post('/exam-results', [ExamResultController::class, 'store'])->middleware('can:create,App\Models\ExamResult')->name('exam-results.store');
    Route::put('/exam-results/{examResult}', [ExamResultController::class, 'update'])->middleware('can:update,examResult')->name('exam-results.update');
    Route::delete('/exam-results/{examResult}', [ExamResultController::class, 'destroy'])->middleware('can:delete,examResult')->name('exam-results.destroy');
    Route::get('/reports', fn () => Inertia::render('admin/reports/index'))->middleware('can:viewReports')->name('reports');
    Route::get('/certs', [CertificateController::class, 'index'])->middleware('can:view,App\Models\Certificate')->name('certs');
    Route::post('/certs', [CertificateController::class, 'store'])->middleware('can:create,App\Models\Certificate')->name('certs.store');
    Route::put('/certs/{certificate}', [CertificateController::class, 'update'])->middleware('can:update,certificate')->name('certs.update');
    Route::delete('/certs/{certificate}', [CertificateController::class, 'destroy'])->middleware('can:delete,certificate')->name('certs.destroy');
    Route::get('/honor-roll', fn () => Inertia::render('admin/honor-roll/index'))->middleware('can:viewHonorRoll')->name('honor-roll');
    Route::get('/notifications', [NotificationController::class, 'index'])->middleware('can:view,App\Models\Notification')->name('notifications');
    Route::post('/notifications', [NotificationController::class, 'store'])->middleware('can:create,App\Models\Notification')->name('notifications.store');
    Route::put('/notifications/{notification}', [NotificationController::class, 'update'])->middleware('can:update,notification')->name('notifications.update');
    Route::put('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->middleware('can:markRead,notification')->name('notifications.read');
    Route::put('/notifications-read', [NotificationController::class, 'markAllRead'])->middleware('can:markAllRead,App\Models\Notification')->name('notifications.read-all');
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->middleware('can:delete,notification')->name('notifications.destroy');
    Route::get('/activity-logs', [ActivityLogController::class, 'index'])->middleware('can:view,App\Models\ActivityLog')->name('activity-logs');
    Route::post('/activity-logs', [ActivityLogController::class, 'store'])->middleware('can:create,App\Models\ActivityLog')->name('activity-logs.store');
    Route::put('/activity-logs/{activityLog}', [ActivityLogController::class, 'update'])->middleware('can:update,activityLog')->name('activity-logs.update');
    Route::delete('/activity-logs/{activityLog}', [ActivityLogController::class, 'destroy'])->middleware('can:delete,activityLog')->name('activity-logs.destroy');
    Route::get('/roles-permissions', [RolePermissionController::class, 'index'])
        ->middleware('can:viewRolesPermissions')
        ->name('roles-permissions');
    Route::post('/roles', [RolePermissionController::class, 'storeRole'])->middleware('can:create,Spatie\Permission\Models\Role')->name('roles.store');
    Route::put('/roles/{role}', [RolePermissionController::class, 'updateRole'])->middleware('can:update,role')->name('roles.update');
    Route::delete('/roles/{role}', [RolePermissionController::class, 'destroyRole'])->middleware('can:delete,role')->name('roles.destroy');
    Route::post('/permissions', [RolePermissionController::class, 'storePermission'])->middleware('can:create,Spatie\Permission\Models\Permission')->name('permissions.store');
    Route::put('/permissions/{permission}', [RolePermissionController::class, 'updatePermission'])->middleware('can:update,permission')->name('permissions.update');
    Route::delete('/permissions/{permission}', [RolePermissionController::class, 'destroyPermission'])->middleware('can:delete,permission')->name('permissions.destroy');
    Route::get('/settings', [SchoolSettingController::class, 'index'])->middleware('can:view,App\Models\SchoolSetting')->name('settings');
    Route::put('/settings/{group}', [SchoolSettingController::class, 'update'])->middleware('can:update,App\Models\SchoolSetting')->name('settings.update');
});

require __DIR__.'/settings.php';
