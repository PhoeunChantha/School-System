<?php

namespace App\Services\Backends;

use App\Models\AttendanceRecord;
use App\Models\FeeCharge;
use App\Models\GradeRecord;
use App\Models\Payment;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Support\Collection;

class ReportService
{
    /**
     * @return array<string, mixed>
     */
    public function indexData(): array
    {
        $students = Student::query()
            ->with(['level:id,name', 'schoolClass:id,name', 'gradeRecords:id,student_id,speaking,listening,reading,writing,average,graded_at'])
            ->active()
            ->orderBy('name_en')
            ->get();

        $attendanceRates = $this->attendanceRates();
        $studentRows = $this->studentRows($students, $attendanceRates);
        $payments = $this->payments();

        return [
            'reportDate' => now()->format('F Y'),
            'summary' => [
                'totalStudents' => $students->count(),
                'avgAttendance' => $this->averageValue($studentRows, 'attendance'),
                'avgGrade' => $this->averageValue($studentRows, 'average'),
                'feesCollected' => $payments->where('status', 'paid')->sum('amount'),
                'paidCount' => $students->where('fee_status', 'paid')->count(),
                'unpaidCount' => $students->where('fee_status', 'unpaid')->count(),
                'outstandingFees' => $this->outstandingFees(),
            ],
            'attendance' => [
                'classes' => $this->classAttendanceRows($attendanceRates),
                'students' => $studentRows,
            ],
            'grades' => [
                'skills' => $this->skillAverages(),
                'students' => $studentRows,
            ],
            'fees' => [
                'payments' => $payments->values(),
                'students' => $this->feeRows($students),
            ],
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function classAttendanceRows(Collection $attendanceRates): Collection
    {
        return SchoolClass::query()
            ->with(['teacher:id,name_en', 'students:id,school_class_id,status'])
            ->active()
            ->orderBy('name')
            ->get()
            ->map(function (SchoolClass $schoolClass) use ($attendanceRates): array {
                $students = $schoolClass->students->where('status', 'active');
                $classRates = $attendanceRates
                    ->only($students->pluck('id')->all())
                    ->filter(fn (?int $rate): bool => $rate !== null);

                return [
                    'id' => $schoolClass->id,
                    'name' => $schoolClass->name,
                    'teacher' => $schoolClass->teacher?->name_en ?? 'No teacher',
                    'attendance' => $classRates->isNotEmpty() ? (int) round($classRates->avg()) : 0,
                    'studentCount' => $students->count(),
                ];
            });
    }

    /**
     * @param  Collection<int, Student>  $students
     * @return Collection<int, array<string, mixed>>
     */
    private function studentRows(Collection $students, Collection $attendanceRates): Collection
    {
        return $students->map(function (Student $student) use ($attendanceRates): array {
            $grade = $student->gradeRecords->sortByDesc('graded_at')->first();

            return [
                'id' => $student->id,
                'nameKh' => $student->name_kh,
                'nameEn' => $student->name_en,
                'photo' => $student->profile_photo ? asset($student->profile_photo) : null,
                'className' => $student->schoolClass?->name ?? 'No class',
                'level' => $student->level?->name ?? 'No level',
                'attendance' => $attendanceRates->get($student->id, 0),
                'speaking' => (int) ($grade?->speaking ?? 0),
                'listening' => (int) ($grade?->listening ?? 0),
                'reading' => (int) ($grade?->reading ?? 0),
                'writing' => (int) ($grade?->writing ?? 0),
                'average' => (int) round((float) ($grade?->average ?? 0)),
                'feeStatus' => $student->fee_status,
                'monthlyFee' => (float) $student->monthly_fee,
            ];
        });
    }

    /**
     * @return array<int, array{key: string, labelKh: string, label: string, average: int}>
     */
    private function skillAverages(): array
    {
        $averages = GradeRecord::query()
            ->selectRaw('
                ROUND(AVG(speaking)) as speaking,
                ROUND(AVG(listening)) as listening,
                ROUND(AVG(reading)) as reading,
                ROUND(AVG(writing)) as writing
            ')
            ->first();

        return [
            ['key' => 'speaking', 'labelKh' => 'និយាយ', 'label' => 'Speaking', 'average' => (int) ($averages?->speaking ?? 0)],
            ['key' => 'listening', 'labelKh' => 'ស្ដាប់', 'label' => 'Listening', 'average' => (int) ($averages?->listening ?? 0)],
            ['key' => 'reading', 'labelKh' => 'អាន', 'label' => 'Reading', 'average' => (int) ($averages?->reading ?? 0)],
            ['key' => 'writing', 'labelKh' => 'សរសេរ', 'label' => 'Writing', 'average' => (int) ($averages?->writing ?? 0)],
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function payments(): Collection
    {
        return Payment::query()
            ->with('student:id,name_kh,name_en')
            ->latest('paid_on')
            ->limit(50)
            ->get()
            ->map(fn (Payment $payment): array => [
                'id' => $payment->id,
                'studentNameKh' => $payment->student?->name_kh ?? '',
                'studentNameEn' => $payment->student?->name_en ?? 'Unknown student',
                'amount' => (float) $payment->amount,
                'method' => $payment->method,
                'date' => $payment->paid_on?->format('Y-m-d') ?? '',
                'status' => $payment->status,
            ]);
    }

    /**
     * @param  Collection<int, Student>  $students
     * @return Collection<int, array<string, mixed>>
     */
    private function feeRows(Collection $students): Collection
    {
        return $students->map(fn (Student $student): array => [
            'id' => $student->id,
            'nameKh' => $student->name_kh,
            'nameEn' => $student->name_en,
            'photo' => $student->profile_photo ? asset($student->profile_photo) : null,
            'level' => $student->level?->name ?? 'No level',
            'amount' => (float) $student->monthly_fee,
            'status' => $student->fee_status,
        ]);
    }

    /**
     * @return Collection<int, int>
     */
    private function attendanceRates(): Collection
    {
        return AttendanceRecord::query()
            ->selectRaw('student_id, ROUND(AVG(CASE WHEN status = ? THEN 100 ELSE 0 END)) as rate', ['present'])
            ->groupBy('student_id')
            ->pluck('rate', 'student_id')
            ->map(fn ($rate): int => (int) $rate);
    }

    private function outstandingFees(): float
    {
        return (float) FeeCharge::query()
            ->whereIn('status', ['unpaid', 'partial'])
            ->sum('amount');
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     */
    private function averageValue(Collection $rows, string $key): int
    {
        $values = $rows->pluck($key)->filter(fn ($value): bool => $value !== null);

        return $values->isNotEmpty() ? (int) round($values->avg()) : 0;
    }
}
