<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreTeacherRequest;
use App\Http\Requests\Backends\UpdateTeacherRequest;
use App\Models\Teacher;
use App\Services\Backends\TeacherService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class TeacherController extends Controller
{
    public function __construct(
        private readonly TeacherService $teacherService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/teachers/index', $this->teacherService->indexData());
    }

    public function store(StoreTeacherRequest $request): RedirectResponse
    {
        try {
            $this->teacherService->create($request->validated(), $request->user()?->id);

            return to_route('admin.teachers')->with('success', 'Teacher created successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to create teacher. Please try again.');
        }
    }

    public function update(UpdateTeacherRequest $request, Teacher $teacher): RedirectResponse
    {
        try {
            $this->teacherService->update($teacher, $request->validated(), $request->user()?->id);

            return to_route('admin.teachers')->with('success', 'Teacher updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update teacher. Please try again.');
        }
    }

    public function destroy(Request $request, Teacher $teacher): RedirectResponse
    {
        try {
            $this->teacherService->delete($teacher, $request->user()?->id);

            return to_route('admin.teachers')->with('success', 'Teacher deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete teacher. Please try again.');
        }
    }
}
