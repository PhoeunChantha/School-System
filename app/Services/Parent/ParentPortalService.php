<?php

namespace App\Services\Parent;

use App\Models\Certificate;
use App\Models\Exam;
use App\Models\FeeCharge;
use App\Models\GradeRecord;
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
            'recentFees' => $this->recentFees($student, 3),
            'upcomingExams' => $this->upcomingExams($student, 3),
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
    private function recentFees(?Student $student, int $limit): array
    {
        if (! $student) {
            return [];
        }

        return FeeCharge::query()
            ->where('student_id', $student->id)
            ->latest('billing_month')
            ->take($limit)
            ->get()
            ->map(fn (FeeCharge $feeCharge): array => [
                'month' => $feeCharge->billing_month?->format('M Y') ?? '',
                'amount' => (float) $feeCharge->amount,
                'paid' => (float) $feeCharge->paid_amount,
                'status' => $feeCharge->status,
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
}
