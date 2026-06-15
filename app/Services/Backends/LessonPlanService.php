<?php

namespace App\Services\Backends;

use App\Models\LessonPlan;
use App\Models\LessonPlanAttachment;
use App\Models\SchoolClass;
use App\Models\Teacher;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class LessonPlanService
{
    public function __construct(
        private readonly ClassStudentNotificationService $classStudentNotificationService,
    ) {}

    /**
     * @return array{lessonPlans: mixed, teachers: mixed, classes: mixed, today: string, tomorrow: string, summary: array<string, int>}
     */
    public function indexData(): array
    {
        $today = today();
        $tomorrow = today()->addDay();

        $lessonPlans = LessonPlan::query()
            ->with(['teacher:id,name_en,profile_photo', 'schoolClass:id,name,room,starts_at,ends_at', 'attachments'])
            ->whereBetween('lesson_date', [today()->subWeek(), today()->addWeeks(4)])
            ->orderBy('lesson_date')
            ->orderBy('id')
            ->get()
            ->map(fn (LessonPlan $lessonPlan): array => $this->lessonPlanPayload($lessonPlan));

        return [
            'lessonPlans' => $lessonPlans,
            'teachers' => Teacher::query()
                ->active()
                ->orderBy('name_en')
                ->get(['id', 'name_en', 'profile_photo'])
                ->map(fn (Teacher $teacher): array => [
                    'id' => $teacher->id,
                    'routeKey' => $teacher->routeKey(),
                    'name' => $teacher->name_en,
                    'photo' => $teacher->profile_photo ? asset($teacher->profile_photo) : null,
                ]),
            'classes' => SchoolClass::query()
                ->with('teacher:id,name_en')
                ->active()
                ->orderBy('name')
                ->get(['id', 'teacher_id', 'name', 'room', 'starts_at', 'ends_at'])
                ->map(fn (SchoolClass $schoolClass): array => [
                    'id' => $schoolClass->id,
                    'routeKey' => $schoolClass->routeKey(),
                    'teacherId' => $schoolClass->teacher_id,
                    'name' => $schoolClass->name,
                    'teacher' => $schoolClass->teacher?->name_en ?? 'No teacher',
                    'room' => $schoolClass->room ?? '',
                    'time' => collect([$schoolClass->starts_at, $schoolClass->ends_at])->filter()->implode('-'),
                ]),
            'today' => $today->toDateString(),
            'tomorrow' => $tomorrow->toDateString(),
            'summary' => [
                'today' => $lessonPlans->where('date', $today->toDateString())->count(),
                'tomorrow' => $lessonPlans->where('date', $tomorrow->toDateString())->count(),
                'planned' => $lessonPlans->where('status', 'planned')->count(),
                'taught' => $lessonPlans->where('status', 'taught')->count(),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): LessonPlan
    {
        return DB::transaction(function () use ($data, $userId): LessonPlan {
            $lessonPlan = LessonPlan::create([
                ...$this->normalizedData($data),
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            $this->storeAttachments($lessonPlan, $data['attachments'] ?? []);

            $this->classStudentNotificationService->lessonPlanCreated($lessonPlan, $userId);

            return $lessonPlan;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(LessonPlan $lessonPlan, array $data, ?int $userId): LessonPlan
    {
        return DB::transaction(function () use ($lessonPlan, $data, $userId): LessonPlan {
            $removedAttachments = $lessonPlan->attachments()
                ->whereIn('id', $data['removed_attachment_ids'] ?? [])
                ->get();

            if (($data['input_mode'] ?? 'details') === 'details') {
                $removedAttachments = $lessonPlan->attachments()->get();
            }

            $lessonPlan->update([
                ...$this->normalizedData($data, $lessonPlan),
                'updated_by' => $userId,
            ]);

            $lessonPlan->attachments()->whereKey($removedAttachments->modelKeys())->delete();
            $this->storeAttachments($lessonPlan, $data['attachments'] ?? []);
            DB::afterCommit(fn () => $removedAttachments->each(fn (LessonPlanAttachment $attachment) => $this->deleteAttachmentFile($attachment->path)));

            return $lessonPlan->refresh();
        });
    }

    public function delete(LessonPlan $lessonPlan, ?int $userId): void
    {
        DB::transaction(function () use ($lessonPlan, $userId): void {
            $attachments = $lessonPlan->attachments()->get();
            $lessonPlan->update([
                'updated_by' => $userId,
            ]);

            $lessonPlan->attachments()->delete();
            $lessonPlan->delete();
            DB::afterCommit(fn () => $attachments->each(fn (LessonPlanAttachment $attachment) => $this->deleteAttachmentFile($attachment->path)));
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function lessonPlanPayload(LessonPlan $lessonPlan): array
    {
        return [
            'id' => $lessonPlan->id,
            'routeKey' => $lessonPlan->routeKey(),
            'teacherId' => $lessonPlan->teacher_id,
            'teacher' => $lessonPlan->teacher?->name_en ?? 'No teacher',
            'teacherPhoto' => $lessonPlan->teacher?->profile_photo ? asset($lessonPlan->teacher->profile_photo) : null,
            'classId' => $lessonPlan->school_class_id,
            'className' => $lessonPlan->schoolClass?->name ?? 'No class',
            'room' => $lessonPlan->schoolClass?->room ?? '',
            'time' => collect([$lessonPlan->schoolClass?->starts_at, $lessonPlan->schoolClass?->ends_at])->filter()->implode('-'),
            'date' => $lessonPlan->lesson_date?->toDateString(),
            'day' => $lessonPlan->lesson_date?->format('D'),
            'title' => $lessonPlan->title,
            'objective' => $lessonPlan->objective ?? '',
            'content' => $lessonPlan->content ?? '',
            'materials' => $lessonPlan->materials ?? '',
            'homework' => $lessonPlan->homework ?? '',
            'status' => $lessonPlan->status,
            'inputMode' => $lessonPlan->input_mode ?? 'details',
            'attachments' => $lessonPlan->attachments->map(fn (LessonPlanAttachment $attachment): array => [
                'id' => $attachment->id,
                'name' => $attachment->original_name,
                'url' => asset($attachment->path),
                'mimeType' => $attachment->mime_type,
                'size' => $attachment->size,
                'isImage' => Str::startsWith($attachment->mime_type, 'image/'),
            ])->values(),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizedData(array $data, ?LessonPlan $lessonPlan = null): array
    {
        $inputMode = $data['input_mode'] ?? 'details';
        $firstFile = collect($data['attachments'] ?? [])->first();
        $fallbackTitle = $firstFile instanceof UploadedFile
            ? pathinfo($firstFile->getClientOriginalName(), PATHINFO_FILENAME)
            : ($lessonPlan?->title ?? 'Uploaded lesson plan');

        return [
            'teacher_id' => $data['teacher_id'],
            'school_class_id' => $data['school_class_id'],
            'lesson_date' => $data['lesson_date'],
            'title' => $inputMode === 'files' ? ($data['title'] ?: $fallbackTitle) : $data['title'],
            'objective' => $inputMode === 'details' ? ($data['objective'] ?? null) : null,
            'content' => $inputMode === 'details' ? ($data['content'] ?? null) : null,
            'materials' => $inputMode === 'details' ? ($data['materials'] ?? null) : null,
            'homework' => $inputMode === 'details' ? ($data['homework'] ?? null) : null,
            'status' => $data['status'],
            'input_mode' => $inputMode,
        ];
    }

    /** @param array<int, UploadedFile> $attachments */
    private function storeAttachments(LessonPlan $lessonPlan, array $attachments): void
    {
        if ($attachments === []) {
            return;
        }

        $destination = public_path('uploads/lesson-plans/'.$lessonPlan->id);
        File::ensureDirectoryExists($destination);
        $maximumSortOrder = $lessonPlan->attachments()->max('sort_order');
        $sortOrder = $maximumSortOrder === null ? 0 : ((int) $maximumSortOrder + 1);
        $storedPaths = [];

        try {
            foreach ($attachments as $attachment) {
                $originalName = $attachment->getClientOriginalName();
                $mimeType = $attachment->getMimeType() ?: 'application/octet-stream';
                $extension = strtolower($attachment->getClientOriginalExtension());
                $filename = Str::uuid().($extension !== '' ? '.'.$extension : '');
                $relativePath = 'uploads/lesson-plans/'.$lessonPlan->id.'/'.$filename;

                $attachment->move($destination, $filename);
                $storedPaths[] = $relativePath;

                $lessonPlan->attachments()->create([
                    'original_name' => $originalName,
                    'path' => $relativePath,
                    'mime_type' => $mimeType,
                    'size' => File::size(public_path($relativePath)),
                    'sort_order' => $sortOrder++,
                ]);
            }
        } catch (\Throwable $exception) {
            collect($storedPaths)->each(fn (string $path) => $this->deleteAttachmentFile($path));

            throw $exception;
        }
    }

    private function deleteAttachmentFile(string $path): void
    {
        File::delete(public_path($path));
    }
}
