<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Services\Backends\DashboardService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private DashboardService $dashboardService) {}

    public function index(): Response
    {
        return Inertia::render('dashboard', $this->dashboardService->indexData());
    }
}
