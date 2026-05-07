<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreExamRequest;
use App\Http\Requests\Backends\UpdateExamRequest;
use App\Models\Exam;
use App\Services\Backends\ExamService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ExamController extends Controller
{
    /**
     * @var ExamService
     */
    public $examService;

    public function __construct(ExamService $examService)
    {
        $this->examService = $examService;
    }

    public function index(): Response
    {
        return Inertia::render('admin/exam/index', $this->examService->indexData());
    }

    public function store(StoreExamRequest $request): RedirectResponse
    {
        try {
            $this->examService->create($request->validated(), $request->user()?->id);

            return to_route('admin.exam')->with('success', 'Exam saved successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to save exam. Please try again.');
        }
    }

    public function update(UpdateExamRequest $request, Exam $exam): RedirectResponse
    {
        try {
            $this->examService->update($exam, $request->validated(), $request->user()?->id);

            return to_route('admin.exam')->with('success', 'Exam updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update exam. Please try again.');
        }
    }

    public function destroy(Exam $exam): RedirectResponse
    {
        try {
            $this->examService->delete($exam);

            return to_route('admin.exam')->with('success', 'Exam deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete exam. Please try again.');
        }
    }
}
