<?php

namespace App\Services\Parent;

use App\Models\AttendanceRecord;
use App\Models\Certificate;
use App\Models\Exam;
use App\Models\GradeRecord;
use App\Models\HomeworkAssignment;
use App\Models\HomeworkSubmission;
use App\Models\Notification;
use App\Models\Student;
use App\Support\ParentAccessSettings;
use Illuminate\Support\Collection;

class ParentPortalService
{
    public function __construct(private readonly ParentAccessSettings $parentAccessSettings) {}

    /**
     * @return array<string, mixed>
     */
    public function dashboardData(string $phone): array
    {
        $students = $this->studentsForPhone($phone);
        $student = $students->first();

        return [
            'profile' => $this->profile($student, $students->count()),
            'stats' => $this->stats($student),
            'recentGrades' => $this->recentGrades($student, 3),
            'recentHomework' => $this->recentHomework($student, 4),
            'upcomingExams' => $this->upcomingExams($student, 3),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function attendanceData(string $phone): array
    {
        $students = $this->studentsForPhone($phone);
        $student = $students->first();

        return [
            'profile' => $this->profile($student, $students->count()),
            'summary' => $this->attendanceSummary($student),
            'records' => $this->attendanceRecords($student),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function gradesData(string $phone): array
    {
        $students = $this->studentsForPhone($phone);
        $student = $students->first();

        return [
            'profile' => $this->profile($student, $students->count()),
            'grades' => $this->allGrades($student),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function homeworkData(string $phone): array
    {
        $students = $this->studentsForPhone($phone);
        $student = $students->first();

        return [
            'profile' => $this->profile($student, $students->count()),
            'homework' => $this->allHomework($student),
        ];
    }

    /**
     * @return Collection<int, Student>
     */
    private function studentsForPhone(string $phone): Collection
    {
        $normalizedPhone = $this->parentAccessSettings->normalizePhone($phone);

        return Student::query()
            ->with(['level:id,name', 'schoolClass:id,name'])
            ->whereNotNull('parent_phone')
            ->get()
            ->filter(fn (Student $student): bool => $this->parentAccessSettings->normalizePhone((string) $student->parent_phone) === $normalizedPhone)
            ->values();
    }

    /**
     * @return array<string, mixed>
     */
    private function profile(?Student $student, int $childrenCount): array
    {
        return [
            'studentId' => $student?->id,
            'name' => $student?->name_en ?? 'Parent Portal',
            'nameKh' => $student?->name_kh ?? '',
            'code' => $student?->code ?? '',
            'photo' => $student?->profile_photo ? asset($student->profile_photo) : null,
            'className' => $student?->schoolClass?->name ?? '',
            'level' => $student?->level?->name ?? '',
            'gender' => $student?->gender ?? '',
            'childrenCount' => $childrenCount,
            'unreadNotifications' => $this->unreadNotificationCount($student),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function stats(?Student $student): array
    {
        if (! $student) {
            return ['attendanceRate' => 0, 'latestAverage' => 0, 'homeworkSubmitted' => 0, 'certificatesIssued' => 0];
        }

        $total = $student->attendanceRecords()->count();
        $present = $total > 0
            ? $student->attendanceRecords()->whereIn('status', ['present', 'late', 'excused'])->count()
            : 0;

        return [
            'attendanceRate' => $total > 0 ? (int) round(($present / $total) * 100) : 0,
            'latestAverage' => (int) round((float) ($student->gradeRecords()->latest('graded_at')->value('average') ?? 0)),
            'homeworkSubmitted' => $student->homeworkSubmissions()->whereIn('status', ['submitted', 'graded'])->count(),
            'certificatesIssued' => Certificate::query()
                ->where('student_id', $student->id)
                ->where('status', 'issued')
                ->count(),
        ];
    }

    private function unreadNotificationCount(?Student $student): int
    {
        if (! $student) {
            return 0;
        }

        return Notification::query()
            ->where('student_id', $student->id)
            ->whereNull('read_at')
            ->count();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function recentGrades(?Student $student, int $limit): array
    {
        if (! $student) {
            return [];
        }

        return GradeRecord::query()
            ->with('gradePeriod:id,name')
            ->where('student_id', $student->id)
            ->latest('graded_at')
            ->take($limit)
            ->get()
            ->map(fn (GradeRecord $gradeRecord): array => [
                'period' => $gradeRecord->gradePeriod?->name ?? 'Grade',
                'speaking' => $gradeRecord->speaking,
                'listening' => $gradeRecord->listening,
                'reading' => $gradeRecord->reading,
                'writing' => $gradeRecord->writing,
                'average' => (float) $gradeRecord->average,
                'date' => $gradeRecord->graded_at?->format('Y-m-d') ?? '',
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function recentHomework(?Student $student, int $limit): array
    {
        if (! $student) {
            return [];
        }

        return HomeworkSubmission::query()
            ->with('homeworkAssignment:id,title_en,due_on,points')
            ->where('student_id', $student->id)
            ->latest('submitted_at')
            ->take($limit)
            ->get()
            ->map(fn (HomeworkSubmission $submission): array => [
                'title' => $submission->homeworkAssignment?->title_en ?? 'Homework',
                'due' => $submission->homeworkAssignment?->due_on?->format('Y-m-d') ?? '',
                'score' => $submission->score,
                'points' => $submission->homeworkAssignment?->points ?? 0,
                'status' => $submission->status,
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function upcomingExams(?Student $student, int $limit): array
    {
        if (! $student || ! $student->school_class_id) {
            return [];
        }

        return Exam::query()
            ->where('school_class_id', $student->school_class_id)
            ->where('exam_date', '>=', now()->toDateString())
            ->orderBy('exam_date')
            ->take($limit)
            ->get(['title', 'subject', 'exam_date', 'duration_minutes', 'status'])
            ->map(fn (Exam $exam): array => [
                'title' => $exam->title,
                'subject' => $exam->subject ?? '',
                'date' => $exam->exam_date?->format('Y-m-d') ?? '',
                'duration' => $exam->duration_minutes ?? 0,
                'status' => $exam->status,
            ])
            ->all();
    }

    /**
     * @return array<string, int>
     */
    private function attendanceSummary(?Student $student): array
    {
        if (! $student) {
            return ['total' => 0, 'present' => 0, 'absent' => 0, 'late' => 0, 'excused' => 0, 'rate' => 0];
        }

        $counts = $student->attendanceRecords()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $present = (int) ($counts['present'] ?? 0);
        $absent = (int) ($counts['absent'] ?? 0);
        $late = (int) ($counts['late'] ?? 0);
        $excused = (int) ($counts['excused'] ?? 0);
        $total = (int) $counts->sum();

        return [
            'total' => $total,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'excused' => $excused,
            'rate' => $total > 0 ? (int) round((($present + $late + $excused) / $total) * 100) : 0,
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function attendanceRecords(?Student $student): array
    {
        if (! $student) {
            return [];
        }

        return AttendanceRecord::query()
            ->join('attendance_sessions', 'attendance_records.attendance_session_id', '=', 'attendance_sessions.id')
            ->where('attendance_records.student_id', $student->id)
            ->orderByDesc('attendance_sessions.attendance_date')
            ->get([
                'attendance_records.status',
                'attendance_records.note',
                'attendance_sessions.attendance_date',
                'attendance_sessions.period',
            ])
            ->map(fn ($record): array => [
                'date' => (string) $record->attendance_date,
                'period' => $record->period ?? 'AM',
                'status' => $record->status,
                'note' => $record->note ?? '',
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function allGrades(?Student $student): array
    {
        return $this->recentGrades($student, 50);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function allHomework(?Student $student): array
    {
        if (! $student || ! $student->school_class_id) {
            return [];
        }

        $submissions = HomeworkSubmission::query()
            ->where('student_id', $student->id)
            ->get(['homework_assignment_id', 'submitted_at', 'score', 'status', 'note', 'attachment_path', 'attachment_name'])
            ->keyBy('homework_assignment_id');

        return HomeworkAssignment::query()
            ->where('school_class_id', $student->school_class_id)
            ->latest('due_on')
            ->get(['id', 'title_en', 'title_kh', 'instructions', 'points', 'due_on', 'status'])
            ->map(fn (HomeworkAssignment $homework): array => [
                'id' => $homework->id,
                'title' => $homework->title_en,
                'titleKh' => $homework->title_kh,
                'instructions' => $homework->instructions ?? '',
                'points' => $homework->points ?? 0,
                'due' => $homework->due_on?->format('Y-m-d') ?? '',
                'status' => $homework->status,
                'submission' => isset($submissions[$homework->id]) ? [
                    'submitted' => $submissions[$homework->id]->submitted_at?->format('Y-m-d') ?? '',
                    'score' => $submissions[$homework->id]->score,
                    'status' => $submissions[$homework->id]->status,
                    'note' => $submissions[$homework->id]->note ?? '',
                    'attachmentName' => $submissions[$homework->id]->attachment_name ?? '',
                    'attachmentUrl' => $submissions[$homework->id]->attachment_path ? asset($submissions[$homework->id]->attachment_path) : '',
                ] : null,
            ])
            ->all();
    }
}
