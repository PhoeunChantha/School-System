<?php

namespace App\Services\Student;

use App\Models\AttendanceRecord;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\FeeCharge;
use App\Models\GradeRecord;
use App\Models\HomeworkAssignment;
use App\Models\HomeworkSubmission;
use App\Models\Notification;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StudentPortalService
{
    public function findStudent(User $user): ?Student
    {
        return Student::query()
            ->with(['level:id,name', 'schoolClass:id,name'])
            ->where('user_id', $user->id)
            ->first()
            ?? Student::query()
                ->with(['level:id,name', 'schoolClass:id,name'])
                ->where(function ($q) use ($user) {
                    $q->where('name_en', $user->name)->orWhere('name_kh', $user->name);
                })
                ->first();
    }

    public function dashboardData(User $user): array
    {
        $student = $this->findStudent($user);

        return [
            'profile' => $this->profile($user, $student),
            'stats' => $this->stats($student),
            'recentGrades' => $this->recentGrades($student, 3),
            'recentHomework' => $this->recentHomework($student, 4),
            'recentFees' => $this->recentFees($student, 3),
            'upcomingExams' => $this->upcomingExams($student, 3),
        ];
    }

    public function attendanceData(User $user): array
    {
        $student = $this->findStudent($user);

        return [
            'profile' => $this->profile($user, $student),
            'summary' => $this->attendanceSummary($student),
            'records' => $this->attendanceRecords($student),
        ];
    }

    public function gradesData(User $user): array
    {
        $student = $this->findStudent($user);

        return [
            'profile' => $this->profile($user, $student),
            'grades' => $this->allGrades($student),
        ];
    }

    public function homeworkData(User $user): array
    {
        $student = $this->findStudent($user);

        return [
            'profile' => $this->profile($user, $student),
            'homework' => $this->allHomework($student),
        ];
    }

    public function feesData(User $user): array
    {
        $student = $this->findStudent($user);

        return [
            'profile' => $this->profile($user, $student),
            'summary' => $this->feesSummary($student),
            'fees' => $this->allFees($student),
        ];
    }

    public function examsData(User $user): array
    {
        $student = $this->findStudent($user);

        return [
            'profile' => $this->profile($user, $student),
            'exams' => $this->allExams($student),
        ];
    }

    public function notificationsData(User $user): array
    {
        $student = $this->findStudent($user);

        return [
            'profile' => $this->profile($user, $student),
            'notifications' => $this->allNotifications($student, $user),
        ];
    }

    public function profileData(User $user): array
    {
        $student = $this->findStudent($user);

        return [
            'profile' => $this->profile($user, $student),
            'student' => $this->fullProfile($student),
        ];
    }

    /**
     * @param  array{note?: string|null, attachment?: \Illuminate\Http\UploadedFile|null}  $data
     */
    public function submitHomework(User $user, HomeworkAssignment $homework, array $data): HomeworkSubmission
    {
        $student = $this->findStudent($user);

        if (! $student) {
            throw ValidationException::withMessages(['attachment' => 'No student profile linked to your account.']);
        }

        if ($homework->school_class_id !== $student->school_class_id) {
            throw ValidationException::withMessages(['attachment' => 'This homework is not assigned to your class.']);
        }

        $submission = HomeworkSubmission::query()
            ->where('homework_assignment_id', $homework->id)
            ->where('student_id', $student->id)
            ->first();

        if ($submission && $submission->status === 'graded') {
            throw ValidationException::withMessages(['attachment' => 'This homework has been graded and can no longer be changed.']);
        }

        $attachmentPath = $submission?->attachment_path;
        $attachmentName = $submission?->attachment_name;

        if (($data['attachment'] ?? null) instanceof UploadedFile) {
            $this->deleteSubmissionAttachment($attachmentPath);
            [$attachmentPath, $attachmentName] = $this->storeSubmissionAttachment($data['attachment']);
        }

        $isLate = $homework->due_on !== null && now()->gt($homework->due_on->endOfDay());

        return HomeworkSubmission::query()->updateOrCreate(
            [
                'homework_assignment_id' => $homework->id,
                'student_id' => $student->id,
            ],
            [
                'submitted_at' => now(),
                'attachment_path' => $attachmentPath,
                'attachment_name' => $attachmentName,
                'note' => $data['note'] ?? null,
                'status' => $isLate ? 'late' : 'submitted',
                'created_by' => $submission?->created_by ?? $user->id,
                'updated_by' => $user->id,
            ],
        );
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function storeSubmissionAttachment(UploadedFile $file): array
    {
        $destination = public_path('uploads/homework-submissions');

        if (! is_dir($destination)) {
            mkdir($destination, 0755, true);
        }

        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $originalName = $file->getClientOriginalName();
        $file->move($destination, $filename);

        return ['uploads/homework-submissions/'.$filename, $originalName];
    }

    private function deleteSubmissionAttachment(?string $path): void
    {
        if ($path && file_exists(public_path($path))) {
            unlink(public_path($path));
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function profile(User $user, ?Student $student): array
    {
        return [
            'name' => $student?->name_en ?? $user->name,
            'nameKh' => $student?->name_kh ?? '',
            'code' => $student?->code ?? '',
            'photo' => $student?->profile_photo ? asset($student->profile_photo)
                         : ($user->avatar ? asset($user->avatar) : null),
            'className' => $student?->schoolClass?->name ?? '',
            'level' => $student?->level?->name ?? '',
            'gender' => $student?->gender ?? '',
        ];
    }

    private function stats(?Student $student): array
    {
        if (! $student) {
            return ['attendanceRate' => 0, 'latestAverage' => 0, 'homeworkSubmitted' => 0, 'unpaidFees' => 0];
        }

        $total = $student->attendanceRecords()->count();
        $present = $total > 0
            ? $student->attendanceRecords()->whereIn('status', ['present', 'late', 'excused'])->count()
            : 0;

        return [
            'attendanceRate' => $total > 0 ? (int) round(($present / $total) * 100) : 0,
            'latestAverage' => (int) round((float) ($student->gradeRecords()->latest('graded_at')->value('average') ?? 0)),
            'homeworkSubmitted' => $student->homeworkSubmissions()->whereIn('status', ['submitted', 'graded'])->count(),
            'unpaidFees' => $student->feeCharges()->whereIn('status', ['unpaid', 'partial'])->count(),
        ];
    }

    private function recentGrades(?Student $student, int $limit = 5): array
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
            ->map(fn (GradeRecord $g) => [
                'period' => $g->gradePeriod?->name ?? 'Grade',
                'speaking' => $g->speaking,
                'listening' => $g->listening,
                'reading' => $g->reading,
                'writing' => $g->writing,
                'average' => (float) $g->average,
                'date' => $g->graded_at?->format('Y-m-d') ?? '',
            ])
            ->all();
    }

    private function recentHomework(?Student $student, int $limit = 5): array
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
            ->map(fn (HomeworkSubmission $s) => [
                'title' => $s->homeworkAssignment?->title_en ?? 'Homework',
                'due' => $s->homeworkAssignment?->due_on?->format('Y-m-d') ?? '',
                'score' => $s->score,
                'points' => $s->homeworkAssignment?->points ?? 0,
                'status' => $s->status,
            ])
            ->all();
    }

    private function recentFees(?Student $student, int $limit = 5): array
    {
        if (! $student) {
            return [];
        }

        return FeeCharge::query()
            ->where('student_id', $student->id)
            ->latest('billing_month')
            ->take($limit)
            ->get()
            ->map(fn (FeeCharge $f) => [
                'month' => $f->billing_month?->format('M Y') ?? '',
                'amount' => (float) $f->amount,
                'paid' => (float) $f->paid_amount,
                'status' => $f->status,
            ])
            ->all();
    }

    private function upcomingExams(?Student $student, int $limit = 5): array
    {
        if (! $student || ! $student->school_class_id) {
            return [];
        }

        return Exam::query()
            ->where('school_class_id', $student->school_class_id)
            ->where('exam_date', '>=', now()->toDateString())
            ->orderBy('exam_date')
            ->take($limit)
            ->get(['id', 'title', 'subject', 'exam_date', 'duration_minutes', 'status'])
            ->map(fn (Exam $e) => [
                'title' => $e->title,
                'subject' => $e->subject ?? '',
                'date' => $e->exam_date?->format('Y-m-d') ?? '',
                'duration' => $e->duration_minutes ?? 0,
                'status' => $e->status,
            ])
            ->all();
    }

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

    private function attendanceRecords(?Student $student): array
    {
        if (! $student) {
            return [];
        }

        return AttendanceRecord::query()
            ->join('attendance_sessions', 'attendance_records.attendance_session_id', '=', 'attendance_sessions.id')
            ->where('attendance_records.student_id', $student->id)
            ->orderByDesc('attendance_sessions.attendance_date')
            ->select(
                'attendance_records.status',
                'attendance_records.note',
                'attendance_sessions.attendance_date',
                'attendance_sessions.period',
            )
            ->get()
            ->map(fn ($r) => [
                'date' => $r->attendance_date,
                'period' => $r->period ?? 'AM',
                'status' => $r->status,
                'note' => $r->note ?? '',
            ])
            ->all();
    }

    private function allGrades(?Student $student): array
    {
        if (! $student) {
            return [];
        }

        return GradeRecord::query()
            ->with('gradePeriod:id,name')
            ->where('student_id', $student->id)
            ->latest('graded_at')
            ->get()
            ->map(fn (GradeRecord $g) => [
                'period' => $g->gradePeriod?->name ?? 'Grade',
                'speaking' => $g->speaking,
                'listening' => $g->listening,
                'reading' => $g->reading,
                'writing' => $g->writing,
                'average' => (float) $g->average,
                'date' => $g->graded_at?->format('Y-m-d') ?? '',
            ])
            ->all();
    }

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
            ->map(fn (HomeworkAssignment $hw) => [
                'id' => $hw->id,
                'routeKey' => $hw->routeKey(),
                'title' => $hw->title_en,
                'titleKh' => $hw->title_kh,
                'instructions' => $hw->instructions ?? '',
                'points' => $hw->points ?? 0,
                'due' => $hw->due_on?->format('Y-m-d') ?? '',
                'status' => $hw->status,
                'submission' => isset($submissions[$hw->id]) ? [
                    'submitted' => $submissions[$hw->id]->submitted_at?->format('Y-m-d') ?? '',
                    'score' => $submissions[$hw->id]->score,
                    'status' => $submissions[$hw->id]->status,
                    'note' => $submissions[$hw->id]->note ?? '',
                    'attachmentName' => $submissions[$hw->id]->attachment_name ?? '',
                    'attachmentUrl' => $submissions[$hw->id]->attachment_path ? asset($submissions[$hw->id]->attachment_path) : '',
                ] : null,
            ])
            ->all();
    }

    private function feesSummary(?Student $student): array
    {
        if (! $student) {
            return ['total' => 0, 'paid' => 0, 'pending' => 0, 'count' => 0, 'unpaidCount' => 0];
        }

        $fees = $student->feeCharges()->get(['amount', 'paid_amount', 'status']);

        return [
            'total' => (float) $fees->sum('amount'),
            'paid' => (float) $fees->sum('paid_amount'),
            'pending' => (float) ($fees->sum('amount') - $fees->sum('paid_amount')),
            'count' => $fees->count(),
            'unpaidCount' => $fees->whereIn('status', ['unpaid', 'partial'])->count(),
        ];
    }

    private function allFees(?Student $student): array
    {
        if (! $student) {
            return [];
        }

        return FeeCharge::query()
            ->where('student_id', $student->id)
            ->orderByDesc('billing_month')
            ->get()
            ->map(fn (FeeCharge $f) => [
                'billingMonth' => $f->billing_month?->format('M Y') ?? '',
                'due' => $f->due_on?->format('Y-m-d') ?? '',
                'amount' => (float) $f->amount,
                'paid' => (float) $f->paid_amount,
                'discount' => (float) $f->discount_amount,
                'balance' => (float) ($f->amount - $f->paid_amount),
                'status' => $f->status,
            ])
            ->all();
    }

    private function allExams(?Student $student): array
    {
        if (! $student || ! $student->school_class_id) {
            return [];
        }

        $results = ExamResult::query()
            ->where('student_id', $student->id)
            ->get(['exam_id', 'score', 'max_score', 'status', 'note'])
            ->keyBy('exam_id');

        return Exam::query()
            ->where('school_class_id', $student->school_class_id)
            ->orderByDesc('exam_date')
            ->get(['id', 'title', 'subject', 'exam_date', 'duration_minutes', 'status'])
            ->map(fn (Exam $e) => [
                'id' => $e->id,
                'title' => $e->title,
                'subject' => $e->subject ?? '',
                'date' => $e->exam_date?->format('Y-m-d') ?? '',
                'duration' => $e->duration_minutes ?? 0,
                'status' => $e->status,
                'result' => isset($results[$e->id]) ? [
                    'score' => (float) $results[$e->id]->score,
                    'maxScore' => (float) $results[$e->id]->max_score,
                    'status' => $results[$e->id]->status,
                    'note' => $results[$e->id]->note ?? '',
                ] : null,
            ])
            ->all();
    }

    private function allNotifications(?Student $student, User $user): array
    {
        return Notification::query()
            ->where(function ($q) use ($student, $user) {
                if ($student) {
                    $q->where('student_id', $student->id)
                        ->orWhere('user_id', $user->id)
                        ->orWhereNull('student_id');
                } else {
                    $q->where('user_id', $user->id)->orWhereNull('student_id');
                }
            })
            ->latest()
            ->take(50)
            ->get()
            ->map(fn (Notification $n) => [
                'id' => $n->id,
                'category' => $n->category ?? 'general',
                'title' => $n->title,
                'body' => $n->body,
                'severity' => $n->severity ?? 'info',
                'read' => $n->read_at !== null,
                'createdAt' => $n->created_at?->format('Y-m-d H:i') ?? '',
            ])
            ->all();
    }

    private function fullProfile(?Student $student): array
    {
        if (! $student) {
            return [];
        }

        return [
            'nameEn' => $student->name_en,
            'nameKh' => $student->name_kh,
            'code' => $student->code,
            'gender' => $student->gender,
            'dateOfBirth' => $student->date_of_birth?->format('Y-m-d') ?? '',
            'province' => $student->province ?? '',
            'district' => $student->district ?? '',
            'commune' => $student->commune ?? '',
            'village' => $student->village ?? '',
            'parentPhone' => $student->parent_phone ?? '',
            'telegramUsername' => $student->telegram_username ?? '',
            'monthlyFee' => (float) $student->monthly_fee,
            'scholarshipAmount' => (float) $student->scholarship_amount,
            'feeStatus' => $student->fee_status,
            'status' => $student->status,
            'enrolledOn' => $student->enrolled_on?->format('Y-m-d') ?? '',
            'photo' => $student->profile_photo ? asset($student->profile_photo) : null,
            'className' => $student->schoolClass?->name ?? '',
            'level' => $student->level?->name ?? '',
        ];
    }
}
