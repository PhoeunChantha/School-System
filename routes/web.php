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
use App\Http\Controllers\Backends\LevelController;
use App\Http\Controllers\Backends\NotificationController;
use App\Http\Controllers\Backends\SchoolClassController;
use App\Http\Controllers\Backends\SchoolSettingController;
use App\Http\Controllers\Backends\StudentController;
use App\Http\Controllers\Backends\TeacherController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

// ── Admin School Management ──
Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/', fn () => redirect()->route('dashboard'));
    Route::get('/dashboard', fn () => redirect()->route('dashboard'))->name('dashboard');
    Route::get('/levels', [LevelController::class, 'index'])->name('levels');
    Route::post('/levels', [LevelController::class, 'store'])->name('levels.store');
    Route::put('/levels/{level}', [LevelController::class, 'update'])->name('levels.update');
    Route::delete('/levels/{level}', [LevelController::class, 'destroy'])->name('levels.destroy');
    Route::get('/students', [StudentController::class, 'index'])->name('students');
    Route::get('/students/create', [StudentController::class, 'create'])->name('students.create');
    Route::post('/students', [StudentController::class, 'store'])->name('students.store');
    Route::get('/students/{student}', [StudentController::class, 'show'])->name('students.show');
    Route::get('/students/{student}/edit', [StudentController::class, 'edit'])->name('students.edit');
    Route::put('/students/{student}', [StudentController::class, 'update'])->name('students.update');
    Route::delete('/students/{student}', [StudentController::class, 'destroy'])->name('students.destroy');
    Route::get('/teachers', [TeacherController::class, 'index'])->name('teachers');
    Route::get('/teachers/{teacher}', [TeacherController::class, 'show'])->name('teachers.show');
    Route::post('/teachers', [TeacherController::class, 'store'])->name('teachers.store');
    Route::put('/teachers/{teacher}', [TeacherController::class, 'update'])->name('teachers.update');
    Route::delete('/teachers/{teacher}', [TeacherController::class, 'destroy'])->name('teachers.destroy');
    Route::get('/classes', [SchoolClassController::class, 'index'])->name('classes');
    Route::post('/classes', [SchoolClassController::class, 'store'])->name('classes.store');
    Route::put('/classes/{schoolClass}', [SchoolClassController::class, 'update'])->name('classes.update');
    Route::delete('/classes/{schoolClass}', [SchoolClassController::class, 'destroy'])->name('classes.destroy');
    Route::get('/attendance', [AttendanceSessionController::class, 'index'])->name('attendance');
    Route::post('/attendance', [AttendanceSessionController::class, 'store'])->name('attendance.store');
    Route::put('/attendance/{attendanceSession}', [AttendanceSessionController::class, 'update'])->name('attendance.update');
    Route::delete('/attendance/{attendanceSession}', [AttendanceSessionController::class, 'destroy'])->name('attendance.destroy');
    Route::get('/grades', [GradeRecordController::class, 'index'])->name('grades');
    Route::post('/grades', [GradeRecordController::class, 'store'])->name('grades.store');
    Route::put('/grades/{gradeRecord}', [GradeRecordController::class, 'update'])->name('grades.update');
    Route::delete('/grades/{gradeRecord}', [GradeRecordController::class, 'destroy'])->name('grades.destroy');
    Route::get('/homework', [HomeworkAssignmentController::class, 'index'])->name('homework');
    Route::get('/homework/create', [HomeworkAssignmentController::class, 'create'])->name('homework.create');
    Route::post('/homework', [HomeworkAssignmentController::class, 'store'])->name('homework.store');
    Route::get('/homework/{homeworkAssignment}/edit', [HomeworkAssignmentController::class, 'edit'])->name('homework.edit');
    Route::put('/homework/{homeworkAssignment}', [HomeworkAssignmentController::class, 'update'])->name('homework.update');
    Route::delete('/homework/{homeworkAssignment}', [HomeworkAssignmentController::class, 'destroy'])->name('homework.destroy');
    Route::get('/homework-submissions', [HomeworkSubmissionController::class, 'index'])->name('homework-submissions');
    Route::post('/homework-submissions', [HomeworkSubmissionController::class, 'store'])->name('homework-submissions.store');
    Route::put('/homework-submissions/{homeworkSubmission}', [HomeworkSubmissionController::class, 'update'])->name('homework-submissions.update');
    Route::delete('/homework-submissions/{homeworkSubmission}', [HomeworkSubmissionController::class, 'destroy'])->name('homework-submissions.destroy');
    Route::get('/fee', [FeeChargeController::class, 'index'])->name('fee');
    Route::get('/fee/create', [FeeChargeController::class, 'create'])->name('fee.create');
    Route::post('/fee', [FeeChargeController::class, 'store'])->name('fee.store');
    Route::get('/fee/{feeCharge}/edit', [FeeChargeController::class, 'edit'])->name('fee.edit');
    Route::put('/fee/{feeCharge}', [FeeChargeController::class, 'update'])->name('fee.update');
    Route::delete('/fee/{feeCharge}', [FeeChargeController::class, 'destroy'])->name('fee.destroy');
    Route::post('/fee/{feeCharge}/payments', [FeeChargeController::class, 'payment'])->name('fee.payments.store');
    Route::get('/exam', [ExamController::class, 'index'])->name('exam');
    Route::post('/exam', [ExamController::class, 'store'])->name('exam.store');
    Route::put('/exam/{exam}', [ExamController::class, 'update'])->name('exam.update');
    Route::delete('/exam/{exam}', [ExamController::class, 'destroy'])->name('exam.destroy');
    Route::get('/exam-results', [ExamResultController::class, 'index'])->name('exam-results');
    Route::post('/exam-results', [ExamResultController::class, 'store'])->name('exam-results.store');
    Route::put('/exam-results/{examResult}', [ExamResultController::class, 'update'])->name('exam-results.update');
    Route::delete('/exam-results/{examResult}', [ExamResultController::class, 'destroy'])->name('exam-results.destroy');
    Route::get('/reports', fn () => Inertia::render('admin/reports/index'))->name('reports');
    Route::get('/certs', [CertificateController::class, 'index'])->name('certs');
    Route::post('/certs', [CertificateController::class, 'store'])->name('certs.store');
    Route::put('/certs/{certificate}', [CertificateController::class, 'update'])->name('certs.update');
    Route::delete('/certs/{certificate}', [CertificateController::class, 'destroy'])->name('certs.destroy');
    Route::get('/honor-roll', fn () => Inertia::render('admin/honor-roll/index'))->name('honor-roll');
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications');
    Route::post('/notifications', [NotificationController::class, 'store'])->name('notifications.store');
    Route::put('/notifications/{notification}', [NotificationController::class, 'update'])->name('notifications.update');
    Route::put('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::put('/notifications-read', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
    Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs');
    Route::post('/activity-logs', [ActivityLogController::class, 'store'])->name('activity-logs.store');
    Route::put('/activity-logs/{activityLog}', [ActivityLogController::class, 'update'])->name('activity-logs.update');
    Route::delete('/activity-logs/{activityLog}', [ActivityLogController::class, 'destroy'])->name('activity-logs.destroy');
    Route::get('/settings', [SchoolSettingController::class, 'index'])->name('settings');
    Route::put('/settings/{group}', [SchoolSettingController::class, 'update'])->name('settings.update');
});

require __DIR__.'/settings.php';
