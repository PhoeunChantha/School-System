<?php

namespace App\Services\Backends;

use App\Models\HomeworkAssignment;
use App\Models\SchoolClass;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HomeworkAssignmentService
{
    /**
     * @return array{homework: mixed}
     */
    public function indexData(): array
    {
        return [
            'homework' => HomeworkAssignment::query()
                ->with(['schoolClass' => fn ($query) => $query->select(['id', 'name'])->withCount('students')])
                ->withCount([
                    'submissions as submitted_count' => fn ($query) => $query->whereIn('status', ['submitted', 'graded']),
                    'submissions',
                ])
                ->latest('due_on')
                ->get()
                ->map(fn (HomeworkAssignment $homeworkAssignment): array => $this->homeworkPayload($homeworkAssignment)),
        ];
    }

    /**
     * @return array{classes: mixed}
     */
    public function createData(): array
    {
        return [
            'classes' => $this->classOptions(),
        ];
    }

    /**
     * @return array{homework: array<string, mixed>, classes: mixed}
     */
    public function editData(HomeworkAssignment $homeworkAssignment): array
    {
        return [
            'homework' => [
                'id' => $homeworkAssignment->id,
                'routeKey' => $homeworkAssignment->routeKey(),
                'school_class_id' => $homeworkAssignment->school_class_id,
                'title_kh' => $homeworkAssignment->title_kh,
                'title_en' => $homeworkAssignment->title_en ?? '',
                'instructions' => $homeworkAssignment->instructions ?? '',
                'attachment_name' => $homeworkAssignment->attachment_name ?? '',
                'attachment_url' => $homeworkAssignment->attachment_path ? asset($homeworkAssignment->attachment_path) : '',
                'points' => $homeworkAssignment->points,
                'due_on' => $homeworkAssignment->due_on?->format('Y-m-d') ?? '',
                'academic_year' => $homeworkAssignment->academic_year ?? '',
                'status' => $homeworkAssignment->status,
            ],
            'classes' => $this->classOptions(),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): HomeworkAssignment
    {
        $attachment = $this->storeAttachment($data['attachment_file'] ?? null);

        return DB::transaction(fn (): HomeworkAssignment => HomeworkAssignment::create([
            ...$this->normalizedData($data),
            ...$attachment,
            'assigned_by' => $userId,
            'updated_by' => $userId,
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(HomeworkAssignment $homeworkAssignment, array $data, ?int $userId): HomeworkAssignment
    {
        return DB::transaction(function () use ($homeworkAssignment, $data, $userId): HomeworkAssignment {
            $attachment = [];

            if (($data['attachment_file'] ?? null) instanceof UploadedFile) {
                $this->deleteAttachment($homeworkAssignment->attachment_path);
                $attachment = $this->storeAttachment($data['attachment_file']);
            }

            $homeworkAssignment->update([
                ...$this->normalizedData($data),
                ...$attachment,
                'updated_by' => $userId,
            ]);

            return $homeworkAssignment->refresh();
        });
    }

    public function delete(HomeworkAssignment $homeworkAssignment): void
    {
        DB::transaction(fn (): ?bool => $homeworkAssignment->delete());
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
                'routeKey' => $schoolClass->routeKey(),
                'name' => $schoolClass->name,
                'room' => $schoolClass->room ?? '',
                'student_count' => $schoolClass->students_count,
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function homeworkPayload(HomeworkAssignment $homeworkAssignment): array
    {
        $total = $homeworkAssignment->schoolClass?->students_count ?? 0;

        return [
            'id' => $homeworkAssignment->id,
            'routeKey' => $homeworkAssignment->routeKey(),
            'titleKh' => $homeworkAssignment->title_kh,
            'titleEn' => $homeworkAssignment->title_en ?? '',
            'className' => $homeworkAssignment->schoolClass?->name ?? 'No class',
            'dueOn' => $homeworkAssignment->due_on?->format('Y-m-d') ?? '',
            'points' => $homeworkAssignment->points,
            'attachmentName' => $homeworkAssignment->attachment_name ?? '',
            'attachmentUrl' => $homeworkAssignment->attachment_path ? asset($homeworkAssignment->attachment_path) : '',
            'status' => $homeworkAssignment->status,
            'submitted' => $homeworkAssignment->submitted_count ?? 0,
            'total' => $total,
            'submissions' => $homeworkAssignment->submissions_count ?? 0,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizedData(array $data): array
    {
        return [
            'school_class_id' => $data['school_class_id'],
            'title_kh' => $data['title_kh'],
            'title_en' => $data['title_en'] ?? null,
            'instructions' => $data['instructions'] ?? null,
            'points' => $data['points'],
            'due_on' => $data['due_on'],
            'academic_year' => $data['academic_year'] ?? null,
            'status' => $data['status'],
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
        $destination = public_path('uploads/homework');

        if (! is_dir($destination)) {
            mkdir($destination, 0755, true);
        }

        $file->move($destination, $filename);

        return [
            'attachment_path' => 'uploads/homework/'.$filename,
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
