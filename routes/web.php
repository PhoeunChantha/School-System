<?php

use App\Http\Controllers\Backends\FeeChargeController;
use App\Http\Controllers\Backends\HomeworkAssignmentController;
use App\Http\Controllers\Backends\SchoolClassController;
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
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

// ── Admin School Management ──
Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/', fn () => redirect()->route('dashboard'));
    Route::get('/dashboard', fn () => redirect()->route('dashboard'))->name('dashboard');
    Route::get('/students', [StudentController::class, 'index'])->name('students');
    Route::get('/students/create', [StudentController::class, 'create'])->name('students.create');
    Route::post('/students', [StudentController::class, 'store'])->name('students.store');
    Route::get('/students/{student}/edit', [StudentController::class, 'edit'])->name('students.edit');
    Route::put('/students/{student}', [StudentController::class, 'update'])->name('students.update');
    Route::delete('/students/{student}', [StudentController::class, 'destroy'])->name('students.destroy');
    Route::get('/teachers', [TeacherController::class, 'index'])->name('teachers');
    Route::post('/teachers', [TeacherController::class, 'store'])->name('teachers.store');
    Route::put('/teachers/{teacher}', [TeacherController::class, 'update'])->name('teachers.update');
    Route::delete('/teachers/{teacher}', [TeacherController::class, 'destroy'])->name('teachers.destroy');
    Route::get('/classes', [SchoolClassController::class, 'index'])->name('classes');
    Route::post('/classes', [SchoolClassController::class, 'store'])->name('classes.store');
    Route::put('/classes/{schoolClass}', [SchoolClassController::class, 'update'])->name('classes.update');
    Route::delete('/classes/{schoolClass}', [SchoolClassController::class, 'destroy'])->name('classes.destroy');
    Route::get('/attendance', fn () => Inertia::render('admin/attendance/index'))->name('attendance');
    Route::get('/grades', fn () => Inertia::render('admin/grades/index'))->name('grades');
    Route::get('/homework', [HomeworkAssignmentController::class, 'index'])->name('homework');
    Route::get('/homework/create', [HomeworkAssignmentController::class, 'create'])->name('homework.create');
    Route::post('/homework', [HomeworkAssignmentController::class, 'store'])->name('homework.store');
    Route::get('/homework/{homeworkAssignment}/edit', [HomeworkAssignmentController::class, 'edit'])->name('homework.edit');
    Route::put('/homework/{homeworkAssignment}', [HomeworkAssignmentController::class, 'update'])->name('homework.update');
    Route::delete('/homework/{homeworkAssignment}', [HomeworkAssignmentController::class, 'destroy'])->name('homework.destroy');
    Route::get('/fee', [FeeChargeController::class, 'index'])->name('fee');
    Route::get('/fee/create', [FeeChargeController::class, 'create'])->name('fee.create');
    Route::post('/fee', [FeeChargeController::class, 'store'])->name('fee.store');
    Route::get('/fee/{feeCharge}/edit', [FeeChargeController::class, 'edit'])->name('fee.edit');
    Route::put('/fee/{feeCharge}', [FeeChargeController::class, 'update'])->name('fee.update');
    Route::delete('/fee/{feeCharge}', [FeeChargeController::class, 'destroy'])->name('fee.destroy');
    Route::post('/fee/{feeCharge}/payments', [FeeChargeController::class, 'payment'])->name('fee.payments.store');
    Route::get('/exam', fn () => Inertia::render('admin/exam/index'))->name('exam');
    Route::get('/reports', fn () => Inertia::render('admin/reports/index'))->name('reports');
    Route::get('/certs', fn () => Inertia::render('admin/certs/index'))->name('certs');
    Route::get('/honor-roll', fn () => Inertia::render('admin/honor-roll/index'))->name('honor-roll');
    Route::get('/notifications', fn () => Inertia::render('admin/notifications/index'))->name('notifications');
    Route::get('/settings', fn () => Inertia::render('admin/settings/index'))->name('settings');
});

require __DIR__.'/settings.php';
