<?php

namespace App\Services\Backends;

use App\Models\Exam;
use App\Models\SchoolClass;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExamService
{
    /**
     * @return array{exams: mixed, classes: mixed, summary: array<string, mixed>}
     */
    public function indexData(): array
    {
        $exams = Exam::query()
            ->with(['schoolClass:id,name'])
            ->withCount('results')
            ->latest('exam_date')
            ->latest('id')
            ->get()
            ->map(fn (Exam $exam): array => $this->examPayload($exam));

        return [
            'exams' => $exams,
            'classes' => $this->classOptions(),
            'summary' => [
                'examCount' => $exams->count(),
                'draftCount' => $exams->where('status', 'draft')->count(),
                'publishedCount' => $exams->where('status', 'published')->count(),
                'archivedCount' => $exams->where('status', 'archived')->count(),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): Exam
    {
        $attachmentPath = $this->storeAttachment($data['attachment'] ?? null);

        return DB::transaction(fn (): Exam => Exam::create([
            ...$this->normalizedData($data),
            'attachment_path' => $attachmentPath,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Exam $exam, array $data, ?int $userId): Exam
    {
        return DB::transaction(function () use ($exam, $data, $userId): Exam {
            $attachmentPath = $exam->attachment_path;

            if (($data['attachment'] ?? null) instanceof UploadedFile) {
                $this->deleteAttachment($exam->attachment_path);
                $attachmentPath = $this->storeAttachment($data['attachment']);
            }

            $exam->update([
                ...$this->normalizedData($data),
                'attachment_path' => $attachmentPath,
                'updated_by' => $userId,
            ]);

            return $exam->refresh();
        });
    }

    public function delete(Exam $exam): void
    {
        DB::transaction(fn (): ?bool => $exam->delete());
    }

    /**
     * @return mixed
     */
    private function classOptions()
    {
        return SchoolClass::query()
            ->active()
            ->withCount('students')
            ->orderBy('name')
            ->get(['id', 'name', 'room'])
            ->map(fn (SchoolClass $schoolClass): array => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'room' => $schoolClass->room ?? '',
                'studentCount' => $schoolClass->students_count,
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function examPayload(Exam $exam): array
    {
        $content = is_array($exam->content) ? $exam->content : [];

        return [
            'id' => $exam->id,
            'schoolClassId' => $exam->school_class_id,
            'className' => $exam->schoolClass?->name ?? '',
            'title' => $exam->title,
            'subject' => $exam->subject ?? '',
            'academicYear' => $exam->academic_year ?? '',
            'examDate' => $exam->exam_date?->format('Y-m-d') ?? '',
            'durationMinutes' => $exam->duration_minutes,
            'content' => $content['html'] ?? '',
            'attachmentPath' => $exam->attachment_path,
            'attachmentName' => $exam->attachment_path ? basename($exam->attachment_path) : '',
            'attachmentUrl' => $exam->attachment_path ? asset($exam->attachment_path) : '',
            'status' => $exam->status,
            'resultsCount' => $exam->results_count ?? 0,
            'createdAt' => $exam->created_at?->format('Y-m-d') ?? '',
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizedData(array $data): array
    {
        return [
            'school_class_id' => $data['school_class_id'] ?? null,
            'title' => $data['title'],
            'subject' => $data['subject'] ?? null,
            'academic_year' => $data['academic_year'] ?? null,
            'exam_date' => $data['exam_date'] ?? null,
            'duration_minutes' => $data['duration_minutes'] ?? null,
            'content' => ['html' => $data['content'] ?? ''],
            'status' => $data['status'],
        ];
    }

    private function storeAttachment(mixed $file): ?string
    {
        if (! $file instanceof UploadedFile) {
            return null;
        }

        $destination = public_path('uploads/exams');

        if (! is_dir($destination)) {
            mkdir($destination, 0755, true);
        }

        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $file->move($destination, $filename);

        return 'uploads/exams/'.$filename;
    }

    private function deleteAttachment(?string $path): void
    {
        if ($path && file_exists(public_path($path))) {
            unlink(public_path($path));
        }
    }
}
