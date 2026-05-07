<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreExamResultRequest;
use App\Http\Requests\Backends\UpdateExamResultRequest;
use App\Models\ExamResult;
use App\Services\Backends\ExamResultService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ExamResultController extends Controller
{
    /**
     * @var ExamResultService
     */
    public $examResultService;

    public function __construct(ExamResultService $examResultService)
    {
        $this->examResultService = $examResultService;
    }

    public function index(): Response
    {
        return Inertia::render('admin/exam-results/index', $this->examResultService->indexData());
    }

    public function store(StoreExamResultRequest $request): RedirectResponse
    {
        try {
            $this->examResultService->create($request->validated(), $request->user()?->id);

            return to_route('admin.exam-results')->with('success', 'Exam result saved successfully.');
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to save exam result. Please try again.');
        }
    }

    public function update(UpdateExamResultRequest $request, ExamResult $examResult): RedirectResponse
    {
        try {
            $this->examResultService->update($examResult, $request->validated(), $request->user()?->id);

            return to_route('admin.exam-results')->with('success', 'Exam result updated successfully.');
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update exam result. Please try again.');
        }
    }

    public function destroy(ExamResult $examResult): RedirectResponse
    {
        try {
            $this->examResultService->delete($examResult);

            return to_route('admin.exam-results')->with('success', 'Exam result deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete exam result. Please try again.');
        }
    }
}
