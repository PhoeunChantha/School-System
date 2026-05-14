<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\ImportTeachersRequest;
use App\Http\Requests\Backends\StoreLessonPlanRequest;
use App\Http\Requests\Backends\StoreTeacherRequest;
use App\Http\Requests\Backends\UpdateTeacherRequest;
use App\Models\Teacher;
use App\Services\Backends\LessonPlanService;
use App\Services\Backends\TeacherService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class TeacherController extends Controller
{
    /**
     * @var TeacherService
     */
    public $teacherService;

    public function __construct(
        TeacherService $teacherService,
        private readonly LessonPlanService $lessonPlanService,
    ) {
        $this->teacherService = $teacherService;
    }

    public function index(): Response
    {
        return Inertia::render('admin/teachers/index', $this->teacherService->indexData());
    }

    public function show(Teacher $teacher): Response
    {
        return Inertia::render('admin/teachers/show', $this->teacherService->showData($teacher));
    }

    public function createLessonPlan(Teacher $teacher): Response
    {
        $teacher->load(['schoolClasses' => fn ($query) => $query->active()->orderBy('name')]);

        return Inertia::render('admin/teachers/lesson-plan-form', [
            'teacher' => [
                'id' => $teacher->id,
                'nameKh' => $teacher->name_kh,
                'nameEn' => $teacher->name_en,
                'photo' => $teacher->profile_photo ? asset($teacher->profile_photo) : null,
                'subject' => $teacher->subject,
            ],
            'classes' => $teacher->schoolClasses->map(fn ($schoolClass): array => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'room' => $schoolClass->room ?? '',
                'time' => collect([$schoolClass->starts_at, $schoolClass->ends_at])->filter()->implode('-'),
            ]),
            'today' => today()->toDateString(),
        ]);
    }

    public function storeLessonPlan(StoreLessonPlanRequest $request, Teacher $teacher): RedirectResponse
    {
        $data = $request->validated();

        if (! $teacher->schoolClasses()->whereKey($data['school_class_id'])->exists()) {
            return back()->withErrors([
                'school_class_id' => 'Please select a class assigned to this teacher.',
            ])->withInput();
        }

        try {
            $this->lessonPlanService->create([
                ...$data,
                'teacher_id' => $teacher->id,
            ], $request->user()?->id);

            return to_route('admin.teachers')->with('success', 'Lesson plan created successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to create lesson plan. Please try again.');
        }
    }

    public function downloadLayout(): StreamedResponse
    {
        return $this->csvDownload('teachers-import-layout.csv', [
            TeacherService::IMPORT_COLUMNS,
            [
                'គ្រូ វុទ្ធី',
                'Mr. Vuthy',
                'English Grammar',
                '012345678',
                '@vuthy',
                'active',
            ],
        ]);
    }

    public function import(ImportTeachersRequest $request): RedirectResponse
    {
        try {
            $summary = $this->teacherService->import($request->file('import_file'), $request->user()?->id);

            return to_route('admin.teachers')->with('success', "Teachers imported: {$summary['created']} created, {$summary['updated']} updated, {$summary['skipped']} skipped.");
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to import teachers. Please check the layout and try again.');
        }
    }

    public function export(): StreamedResponse
    {
        return $this->csvDownload('teachers-export.csv', [
            TeacherService::IMPORT_COLUMNS,
            ...$this->teacherService->exportRows(),
        ]);
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
