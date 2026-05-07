<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreActivityLogRequest;
use App\Http\Requests\Backends\UpdateActivityLogRequest;
use App\Models\ActivityLog;
use App\Services\Backends\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ActivityLogController extends Controller
{
    /**
     * @var ActivityLogService
     */
    public $activityLogService;

    public function __construct(ActivityLogService $activityLogService)
    {
        $this->activityLogService = $activityLogService;
    }

    public function index(): Response
    {
        return Inertia::render('admin/activity-logs/index', $this->activityLogService->indexData());
    }

    public function store(StoreActivityLogRequest $request): RedirectResponse
    {
        try {
            $this->activityLogService->create($request->validated());

            return to_route('admin.activity-logs')->with('success', 'Activity log saved successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to save activity log. Please try again.');
        }
    }

    public function update(UpdateActivityLogRequest $request, ActivityLog $activityLog): RedirectResponse
    {
        try {
            $this->activityLogService->update($activityLog, $request->validated());

            return to_route('admin.activity-logs')->with('success', 'Activity log updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update activity log. Please try again.');
        }
    }

    public function destroy(ActivityLog $activityLog): RedirectResponse
    {
        try {
            $this->activityLogService->delete($activityLog);

            return to_route('admin.activity-logs')->with('success', 'Activity log deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete activity log. Please try again.');
        }
    }
}
