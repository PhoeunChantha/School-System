<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreHomeworkAssignmentRequest;
use App\Http\Requests\Backends\UpdateHomeworkAssignmentRequest;
use App\Models\HomeworkAssignment;
use App\Services\Backends\HomeworkAssignmentService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class HomeworkAssignmentController extends Controller
{
    /**
     * @var HomeworkAssignmentService
     */
    public $homeworkAssignmentService;

    public function __construct(HomeworkAssignmentService $homeworkAssignmentService)
    {
        $this->homeworkAssignmentService = $homeworkAssignmentService;
    }

    public function index(): Response
    {
        return Inertia::render('admin/homework/index', $this->homeworkAssignmentService->indexData());
    }

    public function create(): Response
    {
        return Inertia::render('admin/homework/create', $this->homeworkAssignmentService->createData());
    }

    public function store(StoreHomeworkAssignmentRequest $request): RedirectResponse
    {
        
        try {
            $this->homeworkAssignmentService->create($request->validated(), $request->user()?->id);

            return to_route('admin.homework')->with('success', 'Homework assigned successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to assign homework. Please try again.');
        }
    }

    public function edit(HomeworkAssignment $homeworkAssignment): Response
    {
        return Inertia::render('admin/homework/edit', $this->homeworkAssignmentService->editData($homeworkAssignment));
    }

    public function update(UpdateHomeworkAssignmentRequest $request, HomeworkAssignment $homeworkAssignment): RedirectResponse
    {
        try {
            $this->homeworkAssignmentService->update($homeworkAssignment, $request->validated(), $request->user()?->id);

            return to_route('admin.homework')->with('success', 'Homework updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update homework. Please try again.');
        }
    }

    public function destroy(HomeworkAssignment $homeworkAssignment): RedirectResponse
    {
        try {
            $this->homeworkAssignmentService->delete($homeworkAssignment);

            return to_route('admin.homework')->with('success', 'Homework deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete homework. Please try again.');
        }
    }
}
