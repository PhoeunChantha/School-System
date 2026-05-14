<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\ImportAttendanceSessionsRequest;
use App\Http\Requests\Backends\StoreAttendanceSessionRequest;
use App\Http\Requests\Backends\UpdateAttendanceSessionRequest;
use App\Models\AttendanceSession;
use App\Services\Backends\AttendanceSessionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
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

    public function create(Request $request): Response
    {
        $data = $this->attendanceSessionService->indexData();
        $editing = null;

        if ($request->filled('edit')) {
            $editing = collect($data['sessions'])->firstWhere('id', $request->integer('edit'));
        }

        return Inertia::render('admin/attendance/mark', [
            'classes' => $data['classes'],
            'editingSession' => $editing,
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

    public function downloadLayout(): StreamedResponse
    {
        return $this->csvDownload('attendance-import-layout.csv', [
            AttendanceSessionService::IMPORT_COLUMNS,
            [
                'Beginner 1',
                '2026-05-14',
                'morning',
                'STU-1001',
                'Sok Dara',
                'present',
                'On time',
            ],
        ]);
    }

    public function import(ImportAttendanceSessionsRequest $request): RedirectResponse
    {
        $file = $request->file('import_file');

        if (! $file instanceof UploadedFile) {
            return back()->with('error', 'Please select a valid CSV file.');
        }

        try {
            $summary = $this->attendanceSessionService->import($file, $request->user()?->id);

            return to_route('admin.attendance')->with('success', "Attendance imported: {$summary['created']} created, {$summary['updated']} updated, {$summary['skipped']} skipped.");
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to import attendance. Please check the layout and try again.');
        }
    }

    public function export(): StreamedResponse
    {
        return $this->csvDownload('attendance-export.csv', [
            AttendanceSessionService::IMPORT_COLUMNS,
            ...$this->attendanceSessionService->exportRows(),
        ]);
    }

    /**
     * @param  array<int, array<int, mixed>>  $rows
     */
    private function csvDownload(string $filename, array $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($rows): void {
            $handle = fopen('php://output', 'w');

            echo "\xEF\xBB\xBF";

            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
