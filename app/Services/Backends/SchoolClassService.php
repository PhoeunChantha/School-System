<?php

namespace App\Services\Backends;

use App\Models\Level;
use App\Models\SchoolClass;
use App\Models\Teacher;
use Illuminate\Support\Facades\DB;

class SchoolClassService
{
    /**
     * @return array{classes: mixed, levels: mixed, teachers: mixed}
     */
    public function indexData(): array
    {
        return [
            'classes' => SchoolClass::query()
                ->with(['level:id,name,monthly_fee', 'teacher:id,name_en'])
                ->withCount('students')
                ->orderBy('name')
                ->get()
                ->map(fn (SchoolClass $schoolClass): array => [
                    'id' => $schoolClass->id,
                    'levelId' => $schoolClass->level_id,
                    'teacherId' => $schoolClass->teacher_id,
                    'name' => $schoolClass->name,
                    'teacher' => $schoolClass->teacher?->name_en ?? 'No teacher',
                    'time' => collect([$schoolClass->starts_at, $schoolClass->ends_at])->filter()->implode('-'),
                    'room' => $schoolClass->room ?? '',
                    'count' => $schoolClass->students_count,
                    'days' => implode(' ', $schoolClass->days ?? []),
                    'startsAt' => $schoolClass->starts_at,
                    'endsAt' => $schoolClass->ends_at,
                    'capacity' => $schoolClass->capacity,
                    'monthlyFee' => $schoolClass->level?->monthly_fee,
                    'status' => $schoolClass->status,
                ]),
            'levels' => Level::query()
                ->active()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'monthly_fee']),
            'teachers' => Teacher::query()
                ->active()
                ->orderBy('name_en')
                ->get(['id', 'name_en']),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): SchoolClass
    {
        return DB::transaction(fn (): SchoolClass => SchoolClass::create([
            ...$data,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(SchoolClass $schoolClass, array $data, ?int $userId): SchoolClass
    {
        return DB::transaction(function () use ($schoolClass, $data, $userId): SchoolClass {
            $schoolClass->update([
                ...$data,
                'updated_by' => $userId,
            ]);

            return $schoolClass->refresh();
        });
    }

    public function delete(SchoolClass $schoolClass, ?int $userId): void
    {
        DB::transaction(function () use ($schoolClass, $userId): void {
            $schoolClass->update([
                'updated_by' => $userId,
            ]);

            $schoolClass->delete();
        });
    }
}
