<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreStudentRequest;
use App\Http\Requests\Backends\UpdateStudentRequest;
use App\Models\Student;
use App\Services\Backends\StudentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class StudentController extends Controller
{
    /**
     * @var StudentService
     */
    public $studentService;

    public function __construct(StudentService $studentService)
    {
        $this->studentService = $studentService;
    }

    public function index(): Response
    {
        return Inertia::render('admin/students/index', $this->studentService->indexData());
    }

    public function create(): Response
    {
        return Inertia::render('admin/students/create', $this->studentService->createData());
    }

    public function store(StoreStudentRequest $request): RedirectResponse
    {
        try {
            $this->studentService->create($request->validated(), $request->user()?->id);

            return to_route('admin.students')->with('success', 'Student created successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to create student. Please try again.');
        }
    }

    public function show(Student $student): Response
    {
        return Inertia::render('admin/students/show', $this->studentService->showData($student));
    }

    public function edit(Student $student): Response
    {
        return Inertia::render('admin/students/edit', $this->studentService->editData($student));
    }

    public function update(UpdateStudentRequest $request, Student $student): RedirectResponse
    {
        try {
            $this->studentService->update($student, $request->validated(), $request->user()?->id);

            return to_route('admin.students')->with('success', 'Student updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update student. Please try again.');
        }
    }

    public function destroy(Request $request, Student $student): RedirectResponse
    {
        try {
            $this->studentService->delete($student, $request->user()?->id);

            return to_route('admin.students')->with('success', 'Student deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete student. Please try again.');
        }
    }
}
