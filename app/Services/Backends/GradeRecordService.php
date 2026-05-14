<?php

namespace App\Services\Backends;

use App\Models\GradePeriod;
use App\Models\GradeRecord;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class GradeRecordService
{
    /**
     * @var array<int, string>
     */
    public const IMPORT_COLUMNS = [
        'period',
        'student_code',
        'student_name_en',
        'class',
        'speaking',
        'listening',
        'reading',
        'writing',
    ];

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
     * @return array{created: int, updated: int, skipped: int}
     */
    public function import(UploadedFile $file, ?int $userId): array
    {
        $summary = ['created' => 0, 'updated' => 0, 'skipped' => 0];

        foreach ($this->csvRows($file) as $row) {
            $data = $this->gradeImportData($row);

            $validator = Validator::make($data, [
                'grade_period_id' => ['required', 'integer', Rule::exists('grade_periods', 'id')],
                'student_id' => ['required', 'integer', Rule::exists('students', 'id')->whereNull('deleted_at')],
                'school_class_id' => ['nullable', 'integer', Rule::exists('school_classes', 'id')->whereNull('deleted_at')],
                'speaking' => ['required', 'integer', 'min:0', 'max:100'],
                'listening' => ['required', 'integer', 'min:0', 'max:100'],
                'reading' => ['required', 'integer', 'min:0', 'max:100'],
                'writing' => ['required', 'integer', 'min:0', 'max:100'],
            ]);

            if ($validator->fails()) {
                $summary['skipped']++;

                continue;
            }

            DB::transaction(function () use ($data, $userId, &$summary): void {
                $record = GradeRecord::query()
                    ->where('grade_period_id', $data['grade_period_id'])
                    ->where('student_id', $data['student_id'])
                    ->first();

                if ($record) {
                    $record->update([
                        ...$this->normalizedData($data),
                        'updated_by' => $userId,
                        'graded_at' => now(),
                    ]);
                    $summary['updated']++;

                    return;
                }

                GradeRecord::create([
                    ...$this->normalizedData($data),
                    'graded_by' => $userId,
                    'updated_by' => $userId,
                    'graded_at' => now(),
                ]);
                $summary['created']++;
            });
        }

        return $summary;
    }

    /**
     * @return array<int, array<int, mixed>>
     */
    public function exportRows(): array
    {
        return GradeRecord::query()
            ->with([
                'gradePeriod:id,name',
                'student:id,code,name_en',
                'schoolClass:id,name',
            ])
            ->latest('average')
            ->latest('id')
            ->get()
            ->map(fn (GradeRecord $record): array => [
                $record->gradePeriod?->name ?? '',
                $record->student?->code ?? '',
                $record->student?->name_en ?? '',
                $record->schoolClass?->name ?? '',
                $record->speaking,
                $record->listening,
                $record->reading,
                $record->writing,
            ])
            ->all();
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

    /**
     * @return iterable<array<string, string>>
     */
    private function csvRows(UploadedFile $file): iterable
    {
        $handle = fopen($file->getRealPath(), 'r');

        if ($handle === false) {
            return;
        }

        $headers = null;

        while (($row = fgetcsv($handle)) !== false) {
            if ($row === [null] || $row === false) {
                continue;
            }

            if ($headers === null) {
                $headers = array_map(
                    fn (string $header): string => Str::of($header)->trim("\xEF\xBB\xBF \t\n\r\0\x0B")->lower()->replace(' ', '_')->toString(),
                    $row,
                );

                continue;
            }

            $values = array_slice(array_pad($row, count($headers), ''), 0, count($headers));

            yield array_combine($headers, $values) ?: [];
        }

        fclose($handle);
    }

    /**
     * @param  array<string, string>  $row
     * @return array<string, mixed>
     */
    private function gradeImportData(array $row): array
    {
        $studentId = $this->studentId($row['student_code'] ?? null, $row['student_name_en'] ?? null);
        $student = $studentId ? Student::query()->find($studentId) : null;

        return [
            'grade_period_id' => $this->periodId($row['period'] ?? null),
            'student_id' => $studentId,
            'school_class_id' => $this->classId($row['class'] ?? null) ?? $student?->school_class_id,
            'speaking' => $this->emptyToNull($row['speaking'] ?? null),
            'listening' => $this->emptyToNull($row['listening'] ?? null),
            'reading' => $this->emptyToNull($row['reading'] ?? null),
            'writing' => $this->emptyToNull($row['writing'] ?? null),
        ];
    }

    private function periodId(?string $periodName): ?int
    {
        $periodName = $this->emptyToNull($periodName);

        return $periodName ? GradePeriod::query()->where('name', $periodName)->value('id') : null;
    }

    private function studentId(?string $code, ?string $nameEn): ?int
    {
        $code = $this->emptyToNull($code);
        if ($code) {
            return Student::query()
                ->where('code', $code)
                ->whereNull('deleted_at')
                ->value('id');
        }

        $nameEn = $this->emptyToNull($nameEn);

        return $nameEn
            ? Student::query()->where('name_en', $nameEn)->whereNull('deleted_at')->value('id')
            : null;
    }

    private function classId(?string $name): ?int
    {
        $name = $this->emptyToNull($name);

        return $name
            ? SchoolClass::query()->where('name', $name)->whereNull('deleted_at')->value('id')
            : null;
    }

    private function emptyToNull(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
