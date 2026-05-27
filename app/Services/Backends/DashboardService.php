<?php

namespace App\Services\Backends;

use App\Models\FeeCharge;
use App\Models\GradeRecord;
use App\Models\HomeworkAssignment;
use App\Models\HomeworkSubmission;
use App\Models\LessonPlan;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
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
            'topStudentScores' => $this->topStudentScores(),
            'classes' => $this->classes(),
        ];
    }

    public function teacherData(User $user): array
    {
        $teacher = $this->teacherFor($user);
        $classIds = $teacher
            ? SchoolClass::query()->where('teacher_id', $teacher->id)->pluck('id')
            : collect();

        return [
            'profile' => [
                'name' => $teacher?->name_en ?? $user->name,
                'subject' => $teacher?->subject ?? 'Teacher',
                'photo' => $teacher?->profile_photo ? asset($teacher->profile_photo) : ($user->avatar ? asset($user->avatar) : null),
                'assignedClassCount' => $classIds->count(),
            ],
            'stats' => [
                'classes' => $classIds->count(),
                'students' => $classIds->isEmpty() ? 0 : Student::active()->whereIn('school_class_id', $classIds)->count(),
                'lessonPlansThisWeek' => LessonPlan::query()
                    ->when($teacher, fn ($query) => $query->where('teacher_id', $teacher->id), fn ($query) => $query->where('created_by', $user->id))
                    ->whereBetween('lesson_date', [now()->startOfWeek()->toDateString(), now()->endOfWeek()->toDateString()])
                    ->count(),
                'pendingSubmissions' => $classIds->isEmpty()
                    ? 0
                    : HomeworkSubmission::query()
                        ->whereHas('homeworkAssignment', fn ($query) => $query->whereIn('school_class_id', $classIds))
                        ->whereIn('status', ['submitted', 'late'])
                        ->count(),
            ],
            'classes' => $this->teacherClasses($classIds->all()),
            'lessonPlans' => $this->teacherLessonPlans($user, $teacher),
            'homework' => $this->teacherHomework($user, $classIds->all()),
        ];
    }

    public function studentData(User $user): array
    {
        $student = $this->studentFor($user);

        return [
            'profile' => [
                'name' => $student?->name_en ?? $user->name,
                'code' => $student?->code ?? '',
                'photo' => $student?->profile_photo ? asset($student->profile_photo) : ($user->avatar ? asset($user->avatar) : null),
                'className' => $student?->schoolClass?->name ?? 'No class assigned',
                'level' => $student?->level?->name ?? '',
            ],
            'stats' => [
                'attendanceRate' => $student ? $this->studentAttendanceRate($student) : 0,
                'latestAverage' => (int) round((float) ($student?->gradeRecords()->latest('graded_at')->value('average') ?? 0)),
                'homeworkSubmitted' => $student ? $student->homeworkSubmissions()->whereIn('status', ['submitted', 'graded'])->count() : 0,
                'unpaidFees' => $student ? $student->feeCharges()->whereIn('status', ['unpaid', 'partial'])->count() : 0,
            ],
            'latestGrades' => $this->studentGrades($student),
            'homework' => $this->studentHomework($student),
            'fees' => $this->studentFees($student),
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

    private function topStudentScores(): array
    {
        return GradeRecord::query()
            ->with([
                'gradePeriod:id,name',
                'student:id,level_id,school_class_id,name_kh,name_en,profile_photo,status',
                'student.level:id,name',
                'student.schoolClass:id,name',
            ])
            ->whereHas('student', fn ($query) => $query->active())
            ->orderByDesc('average')
            ->latest('graded_at')
            ->take(5)
            ->get()
            ->map(fn (GradeRecord $grade): array => [
                'id' => $grade->id,
                'studentId' => $grade->student_id,
                'nameKh' => $grade->student?->name_kh ?? '',
                'nameEn' => $grade->student?->name_en ?? 'Unknown student',
                'photo' => $grade->student?->profile_photo ? asset($grade->student->profile_photo) : null,
                'level' => $grade->student?->level?->name ?? '',
                'className' => $grade->student?->schoolClass?->name ?? '',
                'period' => $grade->gradePeriod?->name ?? 'Grade',
                'score' => round((float) $grade->average, 1),
            ])
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

    private function teacherFor(User $user): ?Teacher
    {
        return Teacher::query()
            ->where('name_en', $user->name)
            ->orWhere('name_kh', $user->name)
            ->first();
    }

    private function studentFor(User $user): ?Student
    {
        return Student::query()
            ->with(['level:id,name', 'schoolClass:id,name'])
            ->where('name_en', $user->name)
            ->orWhere('name_kh', $user->name)
            ->first();
    }

    /**
     * @param  array<int, int>  $classIds
     */
    private function teacherClasses(array $classIds): array
    {
        if ($classIds === []) {
            return [];
        }

        return SchoolClass::query()
            ->withCount('students')
            ->whereIn('id', $classIds)
            ->orderBy('name')
            ->get(['id', 'name', 'room', 'starts_at', 'ends_at'])
            ->map(fn (SchoolClass $schoolClass): array => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'room' => $schoolClass->room ?? '',
                'time' => collect([$schoolClass->starts_at, $schoolClass->ends_at])->filter()->implode(' - '),
                'students' => $schoolClass->students_count,
            ])
            ->all();
    }

    private function teacherLessonPlans(User $user, ?Teacher $teacher): array
    {
        return LessonPlan::query()
            ->with('schoolClass:id,name')
            ->when($teacher, fn ($query) => $query->where('teacher_id', $teacher->id), fn ($query) => $query->where('created_by', $user->id))
            ->latest('lesson_date')
            ->take(5)
            ->get(['id', 'school_class_id', 'lesson_date', 'title', 'status'])
            ->map(fn (LessonPlan $lessonPlan): array => [
                'id' => $lessonPlan->id,
                'title' => $lessonPlan->title,
                'className' => $lessonPlan->schoolClass?->name ?? '',
                'date' => $lessonPlan->lesson_date?->format('Y-m-d') ?? '',
                'status' => $lessonPlan->status,
            ])
            ->all();
    }

    /**
     * @param  array<int, int>  $classIds
     */
    private function teacherHomework(User $user, array $classIds): array
    {
        return HomeworkAssignment::query()
            ->with('schoolClass:id,name')
            ->withCount('submissions')
            ->when($classIds !== [], fn ($query) => $query->whereIn('school_class_id', $classIds), fn ($query) => $query->where('assigned_by', $user->id))
            ->latest('due_on')
            ->take(5)
            ->get(['id', 'school_class_id', 'title_en', 'due_on', 'status'])
            ->map(fn (HomeworkAssignment $homework): array => [
                'id' => $homework->id,
                'title' => $homework->title_en,
                'className' => $homework->schoolClass?->name ?? '',
                'due' => $homework->due_on?->format('Y-m-d') ?? '',
                'status' => $homework->status,
                'submissions' => $homework->submissions_count,
            ])
            ->all();
    }

    private function studentAttendanceRate(Student $student): int
    {
        $total = $student->attendanceRecords()->count();

        if ($total === 0) {
            return 0;
        }

        $present = $student->attendanceRecords()->whereIn('status', ['present', 'late', 'excused'])->count();

        return (int) round(($present / $total) * 100);
    }

    private function studentGrades(?Student $student): array
    {
        if (! $student) {
            return [];
        }

        return GradeRecord::query()
            ->with('gradePeriod:id,name')
            ->where('student_id', $student->id)
            ->latest('graded_at')
            ->take(5)
            ->get(['id', 'grade_period_id', 'speaking', 'listening', 'reading', 'writing', 'average', 'graded_at'])
            ->map(fn (GradeRecord $grade): array => [
                'id' => $grade->id,
                'period' => $grade->gradePeriod?->name ?? 'Grade',
                'average' => (float) $grade->average,
                'speaking' => $grade->speaking,
                'listening' => $grade->listening,
                'reading' => $grade->reading,
                'writing' => $grade->writing,
                'date' => $grade->graded_at?->format('Y-m-d') ?? '',
            ])
            ->all();
    }

    private function studentHomework(?Student $student): array
    {
        if (! $student) {
            return [];
        }

        return HomeworkSubmission::query()
            ->with('homeworkAssignment:id,title_en,due_on')
            ->where('student_id', $student->id)
            ->latest('submitted_at')
            ->take(5)
            ->get(['id', 'homework_assignment_id', 'submitted_at', 'score', 'status'])
            ->map(fn (HomeworkSubmission $submission): array => [
                'id' => $submission->id,
                'title' => $submission->homeworkAssignment?->title_en ?? 'Homework',
                'due' => $submission->homeworkAssignment?->due_on?->format('Y-m-d') ?? '',
                'submitted' => $submission->submitted_at?->format('Y-m-d') ?? '',
                'score' => $submission->score,
                'status' => $submission->status,
            ])
            ->all();
    }

    private function studentFees(?Student $student): array
    {
        if (! $student) {
            return [];
        }

        return FeeCharge::query()
            ->where('student_id', $student->id)
            ->latest('billing_month')
            ->take(5)
            ->get(['id', 'billing_month', 'due_on', 'amount', 'paid_amount', 'status'])
            ->map(fn (FeeCharge $fee): array => [
                'id' => $fee->id,
                'month' => $fee->billing_month?->format('M Y') ?? '',
                'due' => $fee->due_on?->format('Y-m-d') ?? '',
                'amount' => (float) $fee->amount,
                'paid' => (float) $fee->paid_amount,
                'status' => $fee->status,
            ])
            ->all();
    }
}
