<?php

namespace App\Services\Backends;

use App\Models\Level;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Support\Facades\DB;

class StudentService
{
    /**
     * @return array{students: mixed}
     */
    public function indexData(): array
    {
        return [
            'students' => Student::query()
                ->with([
                    'level:id,name',
                    'schoolClass:id,name',
                    'gradeRecords' => fn ($query) => $query->latest('graded_at')->latest('id'),
                    'attendanceRecords:id,student_id,status',
                ])
                ->orderBy('name_en')
                ->get()
                ->map(fn (Student $student): array => $this->studentPayload($student)),
        ];
    }

    /**
     * @return array{levels: mixed, classes: mixed}
     */
    public function createData(): array
    {
        return $this->formOptions();
    }

    /**
     * @return array{student: array<string, mixed>, levels: mixed, classes: mixed}
     */
    public function editData(Student $student): array
    {
        return [
            'student' => $this->studentFormPayload($student),
            ...$this->formOptions(),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): Student
    {
        return DB::transaction(fn (): Student => Student::create([
            ...$this->normalizedData($data),
            'created_by' => $userId,
            'updated_by' => $userId,
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Student $student, array $data, ?int $userId): Student
    {
        return DB::transaction(function () use ($student, $data, $userId): Student {
            $student->update([
                ...$this->normalizedData($data),
                'updated_by' => $userId,
            ]);

            return $student->refresh();
        });
    }

    public function delete(Student $student, ?int $userId): void
    {
        DB::transaction(function () use ($student, $userId): void {
            $student->update([
                'updated_by' => $userId,
            ]);

            $student->delete();
        });
    }

    /**
     * @return array{levels: mixed, classes: mixed}
     */
    private function formOptions(): array
    {
        return [
            'levels' => Level::query()
                ->active()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'monthly_fee']),
            'classes' => SchoolClass::query()
                ->with('level:id,name')
                ->active()
                ->orderBy('name')
                ->get(['id', 'level_id', 'name', 'starts_at', 'ends_at'])
                ->map(fn (SchoolClass $schoolClass): array => [
                    'id' => $schoolClass->id,
                    'levelId' => $schoolClass->level_id,
                    'name' => $schoolClass->name,
                    'level' => $schoolClass->level?->name,
                    'time' => collect([$schoolClass->starts_at, $schoolClass->ends_at])->filter()->implode('-'),
                ]),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function studentPayload(Student $student): array
    {
        $latestGrade = $student->gradeRecords->first();
        $attendanceTotal = $student->attendanceRecords->count();
        $presentCount = $student->attendanceRecords
            ->whereIn('status', ['present', 'late', 'excused'])
            ->count();
        $attendance = $attendanceTotal > 0 ? (int) round(($presentCount / $attendanceTotal) * 100) : 100;

        return [
            'id' => $student->id,
            'nameKh' => $student->name_kh,
            'nameEn' => $student->name_en,
            'level' => $student->level?->name ?? '',
            'cls' => $student->schoolClass?->name ?? '',
            'attendance' => $attendance,
            'fees' => match ($student->fee_status) {
                'paid' => 'Paid',
                'partial' => 'Partial',
                default => 'Unpaid',
            },
            'amt' => (float) $student->monthly_fee,
            'grade' => [
                'speaking' => $latestGrade?->speaking ?? 0,
                'listening' => $latestGrade?->listening ?? 0,
                'reading' => $latestGrade?->reading ?? 0,
                'writing' => $latestGrade?->writing ?? 0,
            ],
            'village' => $student->village ?? '',
            'province' => $student->province ?? '',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function studentFormPayload(Student $student): array
    {
        return [
            'id' => $student->id,
            'level_id' => $student->level_id,
            'school_class_id' => $student->school_class_id,
            'code' => $student->code,
            'name_kh' => $student->name_kh,
            'name_en' => $student->name_en,
            'date_of_birth' => $student->date_of_birth?->format('Y-m-d'),
            'gender' => $student->gender,
            'province' => $student->province,
            'district' => $student->district,
            'commune' => $student->commune,
            'village' => $student->village,
            'parent_phone' => $student->parent_phone,
            'telegram_username' => $student->telegram_username,
            'monthly_fee' => $student->monthly_fee,
            'scholarship_amount' => $student->scholarship_amount,
            'fee_status' => $student->fee_status,
            'status' => $student->status,
            'enrolled_on' => $student->enrolled_on?->format('Y-m-d'),
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
            'code' => $data['code'] ?? null,
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'gender' => $data['gender'] ?? null,
            'province' => $data['province'] ?? null,
            'district' => $data['district'] ?? null,
            'commune' => $data['commune'] ?? null,
            'village' => $data['village'] ?? null,
            'parent_phone' => $data['parent_phone'] ?? null,
            'telegram_username' => $data['telegram_username'] ?? null,
            'scholarship_amount' => $data['scholarship_amount'] ?? 0,
            'enrolled_on' => $data['enrolled_on'] ?? null,
        ];
    }
}
