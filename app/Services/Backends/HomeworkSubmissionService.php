<?php

namespace App\Services\Backends;

use App\Models\HomeworkAssignment;
use App\Models\HomeworkSubmission;
use App\Models\Student;
use App\Models\User;
use App\Support\HomeworkSubmissionAlerts;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class HomeworkSubmissionService
{
    public function __construct(private readonly HomeworkSubmissionAlerts $homeworkSubmissionAlerts) {}

    /**
     * @return array{submissions: mixed, assignments: mixed, students: mixed, summary: array<string, mixed>}
     */
    public function indexData(?User $user = null): array
    {
        if ($user) {
            $this->homeworkSubmissionAlerts->markAllRead($user);
        }

        $submissions = HomeworkSubmission::query()
            ->with([
                'homeworkAssignment:id,title_kh,title_en,points,due_on,school_class_id',
                'homeworkAssignment.schoolClass:id,name',
                'student:id,name_kh,name_en,profile_photo,level_id,school_class_id',
                'student.level:id,name',
                'student.schoolClass:id,name',
            ])
            ->latest()
            ->get()
            ->map(fn (HomeworkSubmission $submission): array => $this->submissionPayload($submission));

        return [
            'submissions' => $submissions,
            'assignments' => $this->assignmentOptions(),
            'students' => $this->studentOptions(),
            'summary' => [
                'submissionCount' => $submissions->count(),
                'submittedCount' => $submissions->whereIn('status', ['submitted', 'graded'])->count(),
                'gradedCount' => $submissions->where('status', 'graded')->count(),
                'missingCount' => $submissions->where('status', 'missing')->count(),
                'averageScore' => round((float) $submissions->whereNotNull('score')->avg('score'), 2),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): HomeworkSubmission
    {
        try {
            $attachment = $this->storeAttachment($data['attachment_file'] ?? null);

            return DB::transaction(fn (): HomeworkSubmission => HomeworkSubmission::create([
                ...$this->normalizedData($data),
                ...$attachment,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]));
        } catch (QueryException $exception) {
            if ((string) $exception->getCode() === '23000') {
                throw ValidationException::withMessages([
                    'student_id' => 'This student already has a submission for the selected homework.',
                ]);
            }

            throw $exception;
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(HomeworkSubmission $homeworkSubmission, array $data, ?int $userId): HomeworkSubmission
    {
        try {
            return DB::transaction(function () use ($homeworkSubmission, $data, $userId): HomeworkSubmission {
                $attachment = [];

                if (($data['attachment_file'] ?? null) instanceof UploadedFile) {
                    $this->deleteAttachment($homeworkSubmission->attachment_path);
                    $attachment = $this->storeAttachment($data['attachment_file']);
                }

                $homeworkSubmission->update([
                    ...$this->normalizedData($data),
                    ...$attachment,
                    'updated_by' => $userId,
                ]);

                return $homeworkSubmission->refresh();
            });
        } catch (QueryException $exception) {
            if ((string) $exception->getCode() === '23000') {
                throw ValidationException::withMessages([
                    'student_id' => 'This student already has a submission for the selected homework.',
                ]);
            }

            throw $exception;
        }
    }

    public function delete(HomeworkSubmission $homeworkSubmission): void
    {
        DB::transaction(fn (): ?bool => $homeworkSubmission->delete());
    }

    /**
     * @return array{assignments: mixed, students: mixed}
     */
    public function createData(): array
    {
        return [
            'assignments' => $this->assignmentOptions(),
            'students' => $this->studentOptions(),
        ];
    }

    /**
     * @return mixed
     */
    private function assignmentOptions()
    {
        return HomeworkAssignment::query()
            ->with('schoolClass:id,name')
            ->latest('due_on')
            ->get(['id', 'school_class_id', 'title_kh', 'title_en', 'points', 'due_on'])
            ->map(fn (HomeworkAssignment $homeworkAssignment): array => [
                'id' => $homeworkAssignment->id,
                'routeKey' => $homeworkAssignment->routeKey(),
                'titleKh' => $homeworkAssignment->title_kh,
                'titleEn' => $homeworkAssignment->title_en ?? '',
                'className' => $homeworkAssignment->schoolClass?->name ?? '',
                'points' => $homeworkAssignment->points,
                'dueOn' => $homeworkAssignment->due_on?->format('Y-m-d') ?? '',
            ]);
    }

    /**
     * @return mixed
     */
    private function studentOptions()
    {
        return Student::query()
            ->active()
            ->with(['level:id,name', 'schoolClass:id,name'])
            ->orderBy('name_en')
            ->get(['id', 'level_id', 'school_class_id', 'name_kh', 'name_en'])
            ->map(fn (Student $student): array => [
                'id' => $student->id,
                'routeKey' => $student->routeKey(),
                'nameKh' => $student->name_kh,
                'nameEn' => $student->name_en,
                'level' => $student->level?->name ?? '',
                'className' => $student->schoolClass?->name ?? '',
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function submissionPayload(HomeworkSubmission $submission): array
    {
        return [
            'id' => $submission->id,
            'routeKey' => $submission->routeKey(),
            'homeworkAssignmentId' => $submission->homework_assignment_id,
            'assignmentTitleKh' => $submission->homeworkAssignment?->title_kh ?? '',
            'assignmentTitleEn' => $submission->homeworkAssignment?->title_en ?? '',
            'className' => $submission->homeworkAssignment?->schoolClass?->name ?? $submission->student?->schoolClass?->name ?? '',
            'points' => $submission->homeworkAssignment?->points ?? 100,
            'dueOn' => $submission->homeworkAssignment?->due_on?->format('Y-m-d') ?? '',
            'studentId' => $submission->student_id,
            'studentNameKh' => $submission->student?->name_kh ?? '',
            'studentNameEn' => $submission->student?->name_en ?? 'Unknown student',
            'studentPhoto' => $submission->student?->profile_photo ? asset($submission->student->profile_photo) : null,
            'level' => $submission->student?->level?->name ?? '',
            'submittedAt' => $submission->submitted_at?->format('Y-m-d H:i') ?? '',
            'score' => $submission->score,
            'attachmentName' => $submission->attachment_name ?? '',
            'attachmentUrl' => $submission->attachment_path ? asset($submission->attachment_path) : '',
            'status' => $submission->status,
            'feedback' => $submission->feedback ?? '',
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizedData(array $data): array
    {
        return [
            'homework_assignment_id' => $data['homework_assignment_id'],
            'student_id' => $data['student_id'],
            'submitted_at' => $data['submitted_at'] ?? null,
            'score' => $data['score'] ?? null,
            'status' => $data['status'],
            'feedback' => $data['feedback'] ?? null,
        ];
    }

    /**
     * @return array{attachment_path?: string|null, attachment_name?: string|null}
     */
    private function storeAttachment(?UploadedFile $file): array
    {
        if (! $file) {
            return [];
        }

        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $destination = public_path('uploads/homework-submissions');

        if (! is_dir($destination)) {
            mkdir($destination, 0755, true);
        }

        $file->move($destination, $filename);

        return [
            'attachment_path' => 'uploads/homework-submissions/'.$filename,
            'attachment_name' => $file->getClientOriginalName(),
        ];
    }

    private function deleteAttachment(?string $path): void
    {
        if ($path && file_exists(public_path($path))) {
            unlink(public_path($path));
        }
    }
}
