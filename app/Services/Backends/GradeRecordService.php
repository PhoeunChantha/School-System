<?php

namespace App\Services\Backends;

use App\Models\GradePeriod;
use App\Models\GradeRecord;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Support\Facades\DB;

class GradeRecordService
{
    /**
     * @return array{records: mixed, periods: mixed, students: mixed, classes: mixed, summary: array<string, mixed>}
     */
    public function indexData(): array
    {
        $periods = GradePeriod::query()
            ->orderByDesc('is_current')
            ->latest('starts_on')
            ->latest('id')
            ->get(['id', 'name', 'type', 'academic_year', 'is_current']);

        $currentPeriod = $periods->firstWhere('is_current', true) ?? $periods->first();

        $records = GradeRecord::query()
            ->with([
                'gradePeriod:id,name',
                'student:id,name_kh,name_en,level_id,school_class_id,province',
                'student.level:id,name',
                'student.schoolClass:id,name',
                'schoolClass:id,name',
            ])
            ->when($currentPeriod, fn ($query) => $query->where('grade_period_id', $currentPeriod->id))
            ->latest('average')
            ->get()
            ->map(fn (GradeRecord $gradeRecord): array => $this->recordPayload($gradeRecord));

        return [
            'records' => $records,
            'periods' => $periods->map(fn (GradePeriod $period): array => [
                'id' => $period->id,
                'name' => $period->name,
                'type' => $period->type,
                'academicYear' => $period->academic_year ?? '',
                'isCurrent' => $period->is_current,
            ]),
            'students' => $this->studentOptions(),
            'classes' => SchoolClass::query()->active()->orderBy('name')->get(['id', 'name']),
            'summary' => [
                'currentPeriodId' => $currentPeriod?->id,
                'recordCount' => $records->count(),
                'average' => round((float) $records->avg('average'), 2),
                'passingCount' => $records->where('average', '>=', 50)->count(),
                'needsWorkCount' => $records->where('average', '<', 50)->count(),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): GradeRecord
    {
        return DB::transaction(fn (): GradeRecord => GradeRecord::create([
            ...$this->normalizedData($data),
            'graded_by' => $userId,
            'updated_by' => $userId,
            'graded_at' => now(),
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(GradeRecord $gradeRecord, array $data, ?int $userId): GradeRecord
    {
        return DB::transaction(function () use ($gradeRecord, $data, $userId): GradeRecord {
            $gradeRecord->update([
                ...$this->normalizedData($data),
                'updated_by' => $userId,
                'graded_at' => now(),
            ]);

            return $gradeRecord->refresh();
        });
    }

    public function delete(GradeRecord $gradeRecord): void
    {
        DB::transaction(fn (): ?bool => $gradeRecord->delete());
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
                'nameKh' => $student->name_kh,
                'nameEn' => $student->name_en,
                'level' => $student->level?->name ?? '',
                'schoolClassId' => $student->school_class_id,
                'className' => $student->schoolClass?->name ?? '',
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function recordPayload(GradeRecord $gradeRecord): array
    {
        return [
            'id' => $gradeRecord->id,
            'gradePeriodId' => $gradeRecord->grade_period_id,
            'periodName' => $gradeRecord->gradePeriod?->name ?? '',
            'studentId' => $gradeRecord->student_id,
            'studentNameKh' => $gradeRecord->student?->name_kh ?? '',
            'studentNameEn' => $gradeRecord->student?->name_en ?? 'Unknown student',
            'level' => $gradeRecord->student?->level?->name ?? '',
            'classId' => $gradeRecord->school_class_id,
            'className' => $gradeRecord->schoolClass?->name ?? $gradeRecord->student?->schoolClass?->name ?? '',
            'province' => $gradeRecord->student?->province ?? '',
            'speaking' => $gradeRecord->speaking,
            'listening' => $gradeRecord->listening,
            'reading' => $gradeRecord->reading,
            'writing' => $gradeRecord->writing,
            'average' => (float) $gradeRecord->average,
            'gradedAt' => $gradeRecord->graded_at?->format('Y-m-d H:i') ?? '',
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizedData(array $data): array
    {
        $scores = [
            'speaking' => (int) $data['speaking'],
            'listening' => (int) $data['listening'],
            'reading' => (int) $data['reading'],
            'writing' => (int) $data['writing'],
        ];

        $student = Student::query()->find($data['student_id']);

        return [
            'grade_period_id' => $data['grade_period_id'],
            'student_id' => $data['student_id'],
            'school_class_id' => $data['school_class_id'] ?? $student?->school_class_id,
            ...$scores,
            'average' => round(array_sum($scores) / count($scores), 2),
        ];
    }
}
