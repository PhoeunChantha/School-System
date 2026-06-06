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
        $phone = $request->session()->get('parent_access_phone');

        if (! is_string($phone) || $phone === '') {
            return to_route('login')->with('status', 'Please request a parent access SMS link.');
        }

        return Inertia::render('parent/dashboard/index', $this->parentPortalService->dashboardData($phone));
    }
}
