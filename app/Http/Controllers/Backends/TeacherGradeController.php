<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreTeacherGradeRequest;
use App\Models\Teacher;
use App\Services\Backends\TeacherGradeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class TeacherGradeController extends Controller
{
    public function __construct(private readonly TeacherGradeService $teacherGradeService) {}

    public function index(Teacher $teacher): Response
    {
        return Inertia::render('admin/teachers/grades', $this->teacherGradeService->indexData($teacher));
    }

    public function store(StoreTeacherGradeRequest $request, Teacher $teacher): RedirectResponse
    {
        try {
            $this->teacherGradeService->save($teacher, $request->validated(), $request->user()?->id);

            return to_route('admin.teachers.grades', $teacher)->with('success', 'Student score saved successfully.');
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to save student score. Please try again.');
        }
    }
}
