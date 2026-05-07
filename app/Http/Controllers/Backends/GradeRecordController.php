<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreGradeRecordRequest;
use App\Http\Requests\Backends\UpdateGradeRecordRequest;
use App\Models\GradeRecord;
use App\Services\Backends\GradeRecordService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
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
}
