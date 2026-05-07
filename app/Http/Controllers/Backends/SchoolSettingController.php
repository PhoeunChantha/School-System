<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\UpdateSchoolSettingRequest;
use App\Services\Backends\SchoolSettingService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SchoolSettingController extends Controller
{
    /**
     * @var SchoolSettingService
     */
    public $schoolSettingService;

    public function __construct(SchoolSettingService $schoolSettingService)
    {
        $this->schoolSettingService = $schoolSettingService;
    }

    public function index(): Response
    {
        return Inertia::render('admin/settings/index', $this->schoolSettingService->indexData());
    }

    public function update(UpdateSchoolSettingRequest $request, string $group): RedirectResponse
    {
        try {
            $this->schoolSettingService->update($group, $request->validated('value'), $request->user()?->id);

            return to_route('admin.settings')->with('success', 'Settings saved successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to save settings. Please try again.');
        }
    }
}
