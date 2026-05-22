<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Services\Backends\ReportService;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(
        private readonly ReportService $reportService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/reports/index', $this->reportService->indexData());
    }
}
