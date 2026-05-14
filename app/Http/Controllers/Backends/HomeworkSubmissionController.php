<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreHomeworkSubmissionRequest;
use App\Http\Requests\Backends\UpdateHomeworkSubmissionRequest;
use App\Models\HomeworkSubmission;
use App\Services\Backends\HomeworkSubmissionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class HomeworkSubmissionController extends Controller
{
    /**
     * @var HomeworkSubmissionService
     */
    public $homeworkSubmissionService;

    public function __construct(HomeworkSubmissionService $homeworkSubmissionService)
    {
        $this->homeworkSubmissionService = $homeworkSubmissionService;
    }

    public function index(): Response
    {
        return Inertia::render('admin/homework-submissions/index', $this->homeworkSubmissionService->indexData());
    }

    public function create(): Response
    {
        return Inertia::render('admin/homework-submissions/create', $this->homeworkSubmissionService->createData());
    }

    public function store(StoreHomeworkSubmissionRequest $request): RedirectResponse
    {
        try {
            $this->homeworkSubmissionService->create($request->validated(), $request->user()?->id);

            return to_route('admin.homework-submissions')->with('success', 'Homework submission saved successfully.');
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to save homework submission. Please try again.');
        }
    }

    public function update(UpdateHomeworkSubmissionRequest $request, HomeworkSubmission $homeworkSubmission): RedirectResponse
    {
        try {
            $this->homeworkSubmissionService->update($homeworkSubmission, $request->validated(), $request->user()?->id);

            return to_route('admin.homework-submissions')->with('success', 'Homework submission updated successfully.');
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update homework submission. Please try again.');
        }
    }

    public function destroy(HomeworkSubmission $homeworkSubmission): RedirectResponse
    {
        try {
            $this->homeworkSubmissionService->delete($homeworkSubmission);

            return to_route('admin.homework-submissions')->with('success', 'Homework submission deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete homework submission. Please try again.');
        }
    }
}
