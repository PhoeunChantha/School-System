<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\ImportGradeRecordsRequest;
use App\Http\Requests\Backends\StoreGradeRecordRequest;
use App\Http\Requests\Backends\UpdateGradeRecordRequest;
use App\Models\GradeRecord;
use App\Services\Backends\GradeRecordService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class GradeRecordController extends Controller
{
    /**
     * @var GradeRecordService
     */
    public $gradeRecordService;

    public function __construct(GradeRecordService $gradeRecordService)
    {
        $this->gradeRecordService = $gradeRecordService;
    }

    public function index(): Response
    {
        return Inertia::render('admin/grades/index', $this->gradeRecordService->indexData());
    }

    public function store(StoreGradeRecordRequest $request): RedirectResponse
    {
        try {
            $this->gradeRecordService->create($request->validated(), $request->user()?->id);

            return to_route('admin.grades')->with('success', 'Grade saved successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to save grade. Please try again.');
        }
    }

    public function update(UpdateGradeRecordRequest $request, GradeRecord $gradeRecord): RedirectResponse
    {
        try {
            $this->gradeRecordService->update($gradeRecord, $request->validated(), $request->user()?->id);

            return to_route('admin.grades')->with('success', 'Grade updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update grade. Please try again.');
        }
    }

    public function destroy(GradeRecord $gradeRecord): RedirectResponse
    {
        try {
            $this->gradeRecordService->delete($gradeRecord);

            return to_route('admin.grades')->with('success', 'Grade deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete grade. Please try again.');
        }
    }

    public function downloadLayout(): StreamedResponse
    {
        return $this->csvDownload('grades-import-layout.csv', [
            GradeRecordService::IMPORT_COLUMNS,
            [
                'May 2026',
                'STU-1001',
                'Sok Dara',
                'Beginner 1',
                '80',
                '75',
                '82',
                '78',
            ],
        ]);
    }

    public function import(ImportGradeRecordsRequest $request): RedirectResponse
    {
        $file = $request->file('import_file');

        if (! $file instanceof UploadedFile) {
            return back()->with('error', 'Please select a valid CSV file.');
        }

        try {
            $summary = $this->gradeRecordService->import($file, $request->user()?->id);

            return to_route('admin.grades')->with('success', "Grades imported: {$summary['created']} created, {$summary['updated']} updated, {$summary['skipped']} skipped.");
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to import grades. Please check the layout and try again.');
        }
    }

    public function export(): StreamedResponse
    {
        return $this->csvDownload('grades-export.csv', [
            GradeRecordService::IMPORT_COLUMNS,
            ...$this->gradeRecordService->exportRows(),
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
