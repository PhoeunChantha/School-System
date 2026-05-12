<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreAttendanceSessionRequest;
use App\Http\Requests\Backends\UpdateAttendanceSessionRequest;
use App\Models\AttendanceSession;
use App\Services\Backends\AttendanceSessionService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AttendanceSessionController extends Controller
{
    /**
     * @var AttendanceSessionService
     */
    public $attendanceSessionService;

    public function __construct(AttendanceSessionService $attendanceSessionService)
    {
        $this->attendanceSessionService = $attendanceSessionService;
    }

    public function index(): Response
    {
        return Inertia::render('admin/attendance/index', $this->attendanceSessionService->indexData());
    }

    public function store(StoreAttendanceSessionRequest $request): RedirectResponse
    {
        try {
            $this->attendanceSessionService->create($request->validated(), $request->user()?->id);

            return to_route('admin.attendance')->with('success', 'Attendance saved successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to save attendance. Please try again.');
        }
    }

    public function update(UpdateAttendanceSessionRequest $request, AttendanceSession $attendanceSession): RedirectResponse
    {
        try {
            $this->attendanceSessionService->update($attendanceSession, $request->validated(), $request->user()?->id);

            return to_route('admin.attendance')->with('success', 'Attendance updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update attendance. Please try again.');
        }
    }

    public function destroy(AttendanceSession $attendanceSession): RedirectResponse
    {
        try {
            $this->attendanceSessionService->delete($attendanceSession);

            return to_route('admin.attendance')->with('success', 'Attendance deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete attendance. Please try again.');
        }
    }

    public function create(): Response
    {
        $data = $this->attendanceSessionService->indexData();

        return Inertia::render('admin/attendance/mark', [
            'classes' => $data['classes'],
            'editingSession' => null,
        ]);
    }

    public function edit(AttendanceSession $attendanceSession): Response
    {
        $data = $this->attendanceSessionService->indexData();
        $editing = collect($data['sessions'])->firstWhere('id', $attendanceSession->id);

        return Inertia::render('admin/attendance/mark', [
            'classes' => $data['classes'],
            'editingSession' => $editing,
        ]);
    }
}
