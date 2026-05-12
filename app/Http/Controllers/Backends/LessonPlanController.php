<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreLessonPlanRequest;
use App\Http\Requests\Backends\UpdateLessonPlanRequest;
use App\Models\LessonPlan;
use App\Services\Backends\LessonPlanService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class LessonPlanController extends Controller
{
    /**
     * @var LessonPlanService
     */
    public $lessonPlanService;

    public function __construct(LessonPlanService $lessonPlanService)
    {
        $this->lessonPlanService = $lessonPlanService;
    }

    public function index(): Response
    {
        return Inertia::render('admin/lesson-plans/index', $this->lessonPlanService->indexData());
    }

    public function create(): Response
    {
        $data = $this->lessonPlanService->indexData();

        return Inertia::render('admin/lesson-plans/index', array_merge($data, [
            'openForm' => true,
            'editing' => null,
        ]));
    }

    public function edit(LessonPlan $lessonPlan): Response
    {
        $data = $this->lessonPlanService->indexData();
        $editing = collect($data['lessonPlans'])->firstWhere('id', $lessonPlan->id);

        return Inertia::render('admin/lesson-plans/index', array_merge($data, [
            'openForm' => true,
            'editing' => $editing,
        ]));
    }

    public function store(StoreLessonPlanRequest $request): RedirectResponse
    {
        try {
            $this->lessonPlanService->create($request->validated(), $request->user()?->id);

            return to_route('admin.lesson-plans')->with('success', 'Lesson plan created successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to create lesson plan. Please try again.');
        }
    }

    public function update(UpdateLessonPlanRequest $request, LessonPlan $lessonPlan): RedirectResponse
    {
        try {
            $this->lessonPlanService->update($lessonPlan, $request->validated(), $request->user()?->id);

            return to_route('admin.lesson-plans')->with('success', 'Lesson plan updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update lesson plan. Please try again.');
        }
    }

    public function destroy(Request $request, LessonPlan $lessonPlan): RedirectResponse
    {
        try {
            $this->lessonPlanService->delete($lessonPlan, $request->user()?->id);

            return to_route('admin.lesson-plans')->with('success', 'Lesson plan deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete lesson plan. Please try again.');
        }
    }
}
