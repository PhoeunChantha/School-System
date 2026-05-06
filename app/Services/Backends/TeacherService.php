<?php

namespace App\Services\Backends;

use App\Models\SchoolClass;
use App\Models\Teacher;
use Illuminate\Support\Facades\DB;

class TeacherService
{
    /**
     * @return array{teachers: mixed}
     */
    public function indexData(): array
    {
        return [
            'teachers' => Teacher::query()
                ->with(['schoolClasses' => fn ($query) => $query
                    ->withCount('students')
                    ->orderBy('name')])
                ->withCount('schoolClasses')
                ->orderBy('name_en')
                ->get()
                ->map(fn (Teacher $teacher): array => [
                    'id' => $teacher->id,
                    'nameKh' => $teacher->name_kh,
                    'nameEn' => $teacher->name_en,
                    'subject' => $teacher->subject ?? '',
                    'classes' => $teacher->school_classes_count,
                    'students' => $teacher->schoolClasses->sum('students_count'),
                    'phone' => $teacher->phone ?? '',
                    'telegramUsername' => $teacher->telegram_username,
                    'status' => $teacher->status,
                    'schedule' => $teacher->schoolClasses
                        ->map(fn (SchoolClass $schoolClass): array => [
                            'id' => $schoolClass->id,
                            'name' => $schoolClass->name,
                            'time' => collect([$schoolClass->starts_at, $schoolClass->ends_at])->filter()->implode('-'),
                            'room' => $schoolClass->room ?? '',
                            'count' => $schoolClass->students_count,
                            'days' => implode(' ', $schoolClass->days ?? []),
                        ])
                        ->values(),
                ]),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): Teacher
    {
        return DB::transaction(fn (): Teacher => Teacher::create([
            ...$data,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Teacher $teacher, array $data, ?int $userId): Teacher
    {
        return DB::transaction(function () use ($teacher, $data, $userId): Teacher {
            $teacher->update([
                ...$data,
                'updated_by' => $userId,
            ]);

            return $teacher->refresh();
        });
    }

    public function delete(Teacher $teacher, ?int $userId): void
    {
        DB::transaction(function () use ($teacher, $userId): void {
            $teacher->update([
                'updated_by' => $userId,
            ]);

            $teacher->delete();
        });
    }
}
