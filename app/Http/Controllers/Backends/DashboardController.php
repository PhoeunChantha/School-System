<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Services\Backends\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private DashboardService $dashboardService) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user?->hasRole('teacher') && ! $user->hasRole('admin')) {
            return Inertia::render('dashboard/teacher', $this->dashboardService->teacherData($user));
        }

        if ($user?->hasRole('student') && ! $user->hasRole('admin')) {
            return Inertia::render('dashboard/student', $this->dashboardService->studentData($user));
        }

        return Inertia::render('dashboard', $this->dashboardService->indexData());
    }
}
