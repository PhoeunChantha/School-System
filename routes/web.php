<?php

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
    Route::get('/',           fn() => redirect()->route('dashboard'));
    Route::get('/dashboard',  fn() => redirect()->route('dashboard'))->name('dashboard');
    Route::get('/students',   fn() => Inertia::render('admin/students/index'))->name('students');
    Route::get('/teachers',   fn() => Inertia::render('admin/teachers/index'))->name('teachers');
    Route::get('/classes',    fn() => Inertia::render('admin/classes/index'))->name('classes');
    Route::get('/attendance', fn() => Inertia::render('admin/attendance/index'))->name('attendance');
    Route::get('/grades',     fn() => Inertia::render('admin/grades/index'))->name('grades');
    Route::get('/homework',   fn() => Inertia::render('admin/homework/index'))->name('homework');
    Route::get('/fee',        fn() => Inertia::render('admin/fee/index'))->name('fee');
});

require __DIR__.'/settings.php';
