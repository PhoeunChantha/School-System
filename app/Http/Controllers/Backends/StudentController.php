<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\ImportStudentsRequest;
use App\Http\Requests\Backends\StoreStudentRequest;
use App\Http\Requests\Backends\UpdateStudentRequest;
use App\Models\Student;
use App\Services\Backends\StudentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
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

    public function downloadLayout(): StreamedResponse
    {
        return $this->csvDownload('students-import-layout.csv', [
            StudentService::IMPORT_COLUMNS,
            [
                'STU-1001',
                'សុខ ដារ៉ា',
                'Sokh Dara',
                'Beginner 1',
                'Beginner 1A',
                '2012-01-01',
                'male',
                'Prey Veng',
                'Kampong Trabek',
                'Commune',
                'Village',
                '012345678',
                '@parent',
                '25',
                '0',
                'unpaid',
                'active',
                '2026-05-14',
            ],
        ]);
    }

    public function import(ImportStudentsRequest $request): RedirectResponse
    {
        try {
            $summary = $this->studentService->import($request->file('import_file'), $request->user()?->id);

            return to_route('admin.students')->with('success', "Students imported: {$summary['created']} created, {$summary['updated']} updated, {$summary['skipped']} skipped.");
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to import students. Please check the layout and try again.');
        }
    }

    public function export(): StreamedResponse
    {
        return $this->csvDownload('students-export.csv', [
            StudentService::IMPORT_COLUMNS,
            ...$this->studentService->exportRows(),
        ]);
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

    /**
     * @param  array<int, array<int, mixed>>  $rows
     */
    private function csvDownload(string $filename, array $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($rows): void {
            $handle = fopen('php://output', 'w');

            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
