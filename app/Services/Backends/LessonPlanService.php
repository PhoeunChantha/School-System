<?php

namespace App\Services\Backends;

use App\Models\LessonPlan;
use App\Models\SchoolClass;
use App\Models\Teacher;
use Illuminate\Support\Facades\DB;

class LessonPlanService
{
    /**
     * @return array{lessonPlans: mixed, teachers: mixed, classes: mixed, today: string, tomorrow: string, summary: array<string, int>}
     */
    public function indexData(): array
    {
        $today = today();
        $tomorrow = today()->addDay();

        $lessonPlans = LessonPlan::query()
            ->with(['teacher:id,name_en,profile_photo', 'schoolClass:id,name,room,starts_at,ends_at'])
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
        return DB::transaction(fn (): LessonPlan => LessonPlan::create([
            ...$this->normalizedData($data),
            'created_by' => $userId,
            'updated_by' => $userId,
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(LessonPlan $lessonPlan, array $data, ?int $userId): LessonPlan
    {
        return DB::transaction(function () use ($lessonPlan, $data, $userId): LessonPlan {
            $lessonPlan->update([
                ...$this->normalizedData($data),
                'updated_by' => $userId,
            ]);

            return $lessonPlan->refresh();
        });
    }

    public function delete(LessonPlan $lessonPlan, ?int $userId): void
    {
        DB::transaction(function () use ($lessonPlan, $userId): void {
            $lessonPlan->update([
                'updated_by' => $userId,
            ]);

            $lessonPlan->delete();
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
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizedData(array $data): array
    {
        return [
            ...$data,
            'objective' => $data['objective'] ?? null,
            'content' => $data['content'] ?? null,
            'materials' => $data['materials'] ?? null,
            'homework' => $data['homework'] ?? null,
        ];
    }
}
