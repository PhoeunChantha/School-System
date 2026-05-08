<?php

namespace App\Services\Backends;

use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function indexData(): array
    {
        return [
            'stats' => $this->stats(),
            'revenueTrend' => $this->revenueTrend(),
            'feeStatus' => $this->feeStatus(),
            'attendanceByClass' => $this->attendanceByClass(),
            'skillsAvg' => $this->skillsAvg(),
            'atRiskStudents' => $this->atRiskStudents(),
            'recentPayments' => $this->recentPayments(),
            'recentStudents' => $this->recentStudents(),
            'classes' => $this->classes(),
        ];
    }

    private function stats(): array
    {
        $totalStudents = Student::active()->count();
        $totalTeachers = Teacher::where('status', 'active')->count();

        $monthlyRevenue = DB::table('payments')
            ->where('status', 'paid')
            ->whereYear('paid_on', now()->year)
            ->whereMonth('paid_on', now()->month)
            ->sum('amount');

        // Attendance rate across all records in the last 30 days
        $att = DB::table('attendance_records')
            ->join('attendance_sessions', 'attendance_records.attendance_session_id', '=', 'attendance_sessions.id')
            ->where('attendance_sessions.attendance_date', '>=', now()->subDays(30))
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN attendance_records.status IN ('present','late','excused') THEN 1 ELSE 0 END) as present_count")
            ->first();

        $avgAttendance = $att && $att->total > 0
            ? (int) round(($att->present_count / $att->total) * 100)
            : 0;

        return [
            'totalStudents' => $totalStudents,
            'totalTeachers' => $totalTeachers,
            'monthlyRevenue' => (float) $monthlyRevenue,
            'avgAttendance' => $avgAttendance,
        ];
    }

    private function revenueTrend(): array
    {
        $trend = [];

        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);

            $revenue = DB::table('payments')
                ->where('status', 'paid')
                ->whereYear('paid_on', $date->year)
                ->whereMonth('paid_on', $date->month)
                ->sum('amount');

            $students = Student::whereNull('deleted_at')
                ->where('enrolled_on', '<=', $date->endOfMonth()->toDateString())
                ->count();

            $trend[] = [
                'month' => $date->format('M'),
                'revenue' => (float) $revenue,
                'students' => $students,
            ];
        }

        return $trend;
    }

    private function feeStatus(): array
    {
        $counts = Student::active()
            ->select('fee_status', DB::raw('COUNT(*) as count'))
            ->groupBy('fee_status')
            ->pluck('count', 'fee_status');

        return [
            'paid' => (int) ($counts['paid'] ?? 0),
            'unpaid' => (int) ($counts['unpaid'] ?? 0),
            'partial' => (int) ($counts['partial'] ?? 0),
        ];
    }

    private function attendanceByClass(): array
    {
        $stats = DB::table('attendance_records')
            ->join('attendance_sessions', 'attendance_records.attendance_session_id', '=', 'attendance_sessions.id')
            ->where('attendance_sessions.attendance_date', '>=', now()->subDays(30))
            ->select('attendance_sessions.school_class_id')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN attendance_records.status IN ('present','late','excused') THEN 1 ELSE 0 END) as present_count")
            ->groupBy('attendance_sessions.school_class_id')
            ->get()
            ->keyBy('school_class_id');

        return SchoolClass::active()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(function (SchoolClass $class) use ($stats) {
                $record = $stats->get($class->id);
                $rate = $record && $record->total > 0
                    ? (int) round(($record->present_count / $record->total) * 100)
                    : 0;

                $parts = explode(' ', $class->name);
                $short = count($parts) >= 2
                    ? $parts[count($parts) - 2].' '.$parts[count($parts) - 1]
                    : $class->name;

                return ['name' => $class->name, 'short' => $short, 'rate' => $rate];
            })
            ->values()
            ->all();
    }

    private function skillsAvg(): array
    {
        $avg = DB::table('grade_records')
            ->selectRaw('ROUND(AVG(speaking),0) as speaking, ROUND(AVG(listening),0) as listening, ROUND(AVG(reading),0) as reading, ROUND(AVG(writing),0) as writing')
            ->first();

        return [
            'speaking' => (int) ($avg->speaking ?? 0),
            'listening' => (int) ($avg->listening ?? 0),
            'reading' => (int) ($avg->reading ?? 0),
            'writing' => (int) ($avg->writing ?? 0),
        ];
    }

    private function atRiskStudents(): array
    {
        // Get attendance rates per student in the last 30 days (one bulk query)
        $attendanceRates = DB::table('attendance_records')
            ->join('attendance_sessions', 'attendance_records.attendance_session_id', '=', 'attendance_sessions.id')
            ->where('attendance_sessions.attendance_date', '>=', now()->subDays(30))
            ->select('attendance_records.student_id')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN attendance_records.status IN ('present','late','excused') THEN 1 ELSE 0 END) as present_count")
            ->groupBy('attendance_records.student_id')
            ->get()
            ->keyBy('student_id');

        return Student::active()
            ->with('level:id,name')
            ->get()
            ->map(function (Student $student) use ($attendanceRates) {
                $record = $attendanceRates->get($student->id);
                $attendanceRate = $record && $record->total > 0
                    ? (int) round(($record->present_count / $record->total) * 100)
                    : 100;

                return [
                    'id' => $student->id,
                    'nameKh' => $student->name_kh,
                    'nameEn' => $student->name_en,
                    'photo' => $student->profile_photo ? asset($student->profile_photo) : null,
                    'level' => $student->level?->name ?? '',
                    'attendance' => $attendanceRate,
                    'fees' => match ($student->fee_status) {
                        'paid' => 'Paid',
                        'partial' => 'Partial',
                        default => 'Unpaid',
                    },
                ];
            })
            ->filter(fn (array $s) => $s['attendance'] < 70 || $s['fees'] === 'Unpaid')
            ->take(5)
            ->values()
            ->all();
    }

    private function recentPayments(): array
    {
        return DB::table('payments')
            ->join('students', 'payments.student_id', '=', 'students.id')
            ->orderByDesc('payments.paid_on')
            ->orderByDesc('payments.id')
            ->take(5)
            ->get(['payments.id', 'students.name_kh', 'students.name_en', 'payments.amount', 'payments.method', 'payments.paid_on', 'payments.status'])
            ->map(fn ($row) => [
                'id' => $row->id,
                'nameKh' => $row->name_kh,
                'nameEn' => $row->name_en,
                'amount' => (float) $row->amount,
                'method' => ucfirst($row->method),
                'date' => $row->paid_on,
                'status' => $row->status,
            ])
            ->all();
    }

    private function recentStudents(): array
    {
        return Student::active()
            ->with([
                'level:id,name',
                'gradeRecords' => fn ($q) => $q->latest('graded_at')->latest('id'),
            ])
            ->withCount(['attendanceRecords as present_count' => fn ($q) => $q->whereIn('status', ['present', 'late', 'excused'])])
            ->withCount('attendanceRecords as total_att')
            ->latest('enrolled_on')
            ->take(6)
            ->get()
            ->map(function (Student $student) {
                $attendance = $student->total_att > 0
                    ? (int) round(($student->present_count / $student->total_att) * 100)
                    : 100;

                $grade = $student->gradeRecords->first();

                return [
                    'id' => $student->id,
                    'nameKh' => $student->name_kh,
                    'nameEn' => $student->name_en,
                    'photo' => $student->profile_photo ? asset($student->profile_photo) : null,
                    'level' => $student->level?->name ?? '',
                    'attendance' => $attendance,
                    'grade' => [
                        'speaking' => (int) ($grade?->speaking ?? 0),
                        'listening' => (int) ($grade?->listening ?? 0),
                        'reading' => (int) ($grade?->reading ?? 0),
                        'writing' => (int) ($grade?->writing ?? 0),
                    ],
                    'fees' => match ($student->fee_status) {
                        'paid' => 'Paid',
                        'partial' => 'Partial',
                        default => 'Unpaid',
                    },
                    'province' => $student->province ?? '',
                ];
            })
            ->all();
    }

    private function classes(): array
    {
        return SchoolClass::active()
            ->with('teacher:id,name_en')
            ->withCount('students')
            ->orderBy('name')
            ->get()
            ->map(fn (SchoolClass $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'teacher' => $c->teacher?->name_en ?? '—',
                'time' => collect([$c->starts_at, $c->ends_at])->filter()->implode('–'),
                'room' => $c->room ?? '',
                'count' => $c->students_count,
                'days' => implode(' ', array_map('ucfirst', $c->days ?? [])),
            ])
            ->all();
    }
}
