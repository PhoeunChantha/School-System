<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Services\Parent\ParentPortalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParentPortalController extends Controller
{
    public function __construct(private readonly ParentPortalService $parentPortalService) {}

    public function dashboard(Request $request): Response|RedirectResponse
    {
        $phone = $this->parentPhone($request);

        if ($phone === null) {
            return $this->missingParentSession();
        }

        return Inertia::render('parent/dashboard/index', $this->parentPortalService->dashboardData($phone));
    }

    public function attendance(Request $request): Response|RedirectResponse
    {
        $phone = $this->parentPhone($request);

        if ($phone === null) {
            return $this->missingParentSession();
        }

        return Inertia::render('parent/attendance/index', $this->parentPortalService->attendanceData($phone));
    }

    public function grades(Request $request): Response|RedirectResponse
    {
        $phone = $this->parentPhone($request);

        if ($phone === null) {
            return $this->missingParentSession();
        }

        return Inertia::render('parent/grades/index', $this->parentPortalService->gradesData($phone));
    }

    public function homework(Request $request): Response|RedirectResponse
    {
        $phone = $this->parentPhone($request);

        if ($phone === null) {
            return $this->missingParentSession();
        }

        return Inertia::render('parent/homework/index', $this->parentPortalService->homeworkData($phone));
    }

    private function parentPhone(Request $request): ?string
    {
        $phone = $request->session()->get('parent_access_phone');

        if (! is_string($phone) || $phone === '') {
            return null;
        }

        return $phone;
    }

    private function missingParentSession(): RedirectResponse
    {
        return to_route('login')->with('status', 'Please request a parent access SMS link.');
    }
}
