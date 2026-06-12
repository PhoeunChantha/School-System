<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Services\Backends\StudentEnrollmentHistoryService;
use Inertia\Inertia;
use Inertia\Response;

class StudentEnrollmentHistoryController extends Controller
{
    public function __construct(
        private readonly StudentEnrollmentHistoryService $historyService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/enrollment-history/index', $this->historyService->indexData());
    }
}
