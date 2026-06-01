<?php

namespace App\Services\Student;

use App\Events\HomeworkSubmissionSubmitted;
use App\Models\AttendanceRecord;
use App\Models\Certificate;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\FeeCharge;
use App\Models\GradeRecord;
use App\Models\HomeworkAssignment;
use App\Models\HomeworkSubmission;
use App\Models\LessonPlan;
use App\Models\Notification;
use App\Models\Student;
use App\Models\User;
use App\Support\HomeworkSubmissionAlerts;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class StudentPortalService
{
    public function __construct(private readonly HomeworkSubmissionAlerts $homeworkSubmissionAlerts) {}

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

    public function examResultsData(User $user): array
    {
        $student = $this->findStudent($user);
        $results = $this->allExamResults($student);

        return [
            'profile' => $this->profile($user, $student),
            'summary' => [
                'total' => count($results),
                'passed' => collect($results)->where('status', 'passed')->count(),
                'average' => round((float) collect($results)->avg('percent'), 2),
            ],
            'results' => $results,
        ];
    }

    public function classScheduleData(User $user): array
    {
        $student = $this->findStudent($user);

        return [
            'profile' => $this->profile($user, $student),
            'schedule' => $this->classSchedule($student),
        ];
    }

    public function learningMaterialsData(User $user): array
    {
        $student = $this->findStudent($user);
        $materials = $this->learningMaterials($student);

        return [
            'profile' => $this->profile($user, $student),
            'summary' => [
                'total' => count($materials),
                'files' => collect($materials)->where('hasFile', true)->count(),
            ],
            'materials' => $materials,
        ];
    }

    public function attendanceCalendarData(User $user): array
    {
        $student = $this->findStudent($user);
        $records = $this->attendanceCalendarRecords($student);

        return [
            'profile' => $this->profile($user, $student),
            'summary' => [
                'total' => count($records),
                'present' => collect($records)->whereIn('status', ['present', 'late', 'excused'])->count(),
                'absent' => collect($records)->where('status', 'absent')->count(),
            ],
            'records' => $records,
        ];
    }

    public function homeworkCalendarData(User $user): array
    {
        $student = $this->findStudent($user);
        $items = $this->homeworkCalendarItems($student);

        return [
            'profile' => $this->profile($user, $student),
            'summary' => [
                'total' => count($items),
                'submitted' => collect($items)->where('submissionStatus', '!=', 'pending')->count(),
                'pending' => collect($items)->where('submissionStatus', 'pending')->count(),
            ],
            'items' => $items,
        ];
    }

    public function idCardData(User $user): array
    {
        $student = $this->findStudent($user);

        return [
            'profile' => $this->profile($user, $student),
            'student' => $this->idCard($student),
        ];
    }

    public function certificatesData(User $user): array
    {
        $student = $this->findStudent($user);
        $certificates = $this->allCertificates($student);

        return [
            'profile' => $this->profile($user, $student),
            'summary' => [
                'total' => count($certificates),
                'latestIssuedOn' => $certificates[0]['issuedOn'] ?? '',
            ],
            'certificates' => $certificates,
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

    public function notificationDetailData(User $user, Notification $notification): array
    {
        $student = $this->findStudent($user);

        if (! $this->canViewNotification($notification, $student, $user)) {
            abort(404);
        }

        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
            $notification->refresh();
        }

        return [
            'profile' => $this->profile($user, $student),
            'notification' => $this->formatNotification($notification),
            'detail' => $this->notificationTargetDetail($notification, $student),
        ];
    }

    public function markNotificationsRead(User $user): void
    {
        $student = $this->findStudent($user);

        Notification::query()
            ->whereNull('read_at')
            ->where(function ($q) use ($student, $user): void {
                if ($student) {
                    $q->where('student_id', $student->id)
                        ->orWhere('user_id', $user->id)
                        ->orWhereNull('student_id');
                } else {
                    $q->where('user_id', $user->id)->orWhereNull('student_id');
                }
            })
            ->update(['read_at' => now()]);
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
     * @param  array{note?: string|null, attachment?: UploadedFile|null}  $data
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

        $submission = HomeworkSubmission::query()->updateOrCreate(
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

        $submission->refresh();
        $this->homeworkSubmissionAlerts->forgetReads($submission);
        $this->broadcastHomeworkSubmission($submission);

        return $submission;
    }

    private function broadcastHomeworkSubmission(HomeworkSubmission $submission): void
    {
        try {
            HomeworkSubmissionSubmitted::dispatch($submission);
        } catch (Throwable $exception) {
            report($exception);
        }
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
            'studentId' => $student?->id,
            'name' => $student?->name_en ?? $user->name,
            'nameKh' => $student?->name_kh ?? '',
            'code' => $student?->code ?? '',
            'photo' => $student?->profile_photo ? asset($student->profile_photo)
                         : ($user->avatar ? asset($user->avatar) : null),
            'className' => $student?->schoolClass?->name ?? '',
            'level' => $student?->level?->name ?? '',
            'gender' => $student?->gender ?? '',
            'unreadNotifications' => $this->unreadNotificationCount($student, $user),
        ];
    }

    private function unreadNotificationCount(?Student $student, User $user): int
    {
        return Notification::query()
            ->whereNull('read_at')
            ->where(function ($q) use ($student, $user) {
                if ($student) {
                    $q->where('student_id', $student->id)
                        ->orWhere('user_id', $user->id)
                        ->orWhereNull('student_id');
                } else {
                    $q->where('user_id', $user->id)->orWhereNull('student_id');
                }
            })
            ->count();
    }

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
            'certificatesIssued' => $student->certificates()->where('status', 'issued')->count(),
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

    private function allExamResults(?Student $student): array
    {
        if (! $student) {
            return [];
        }

        return ExamResult::query()
            ->with('exam:id,title,subject,exam_date,school_class_id')
            ->where('student_id', $student->id)
            ->latest()
            ->get()
            ->map(function (ExamResult $result): array {
                $maxScore = (float) $result->max_score;
                $score = (float) ($result->score ?? 0);

                return [
                    'id' => $result->id,
                    'examTitle' => $result->exam?->title ?? 'Exam',
                    'subject' => $result->exam?->subject ?? '',
                    'date' => $result->exam?->exam_date?->format('Y-m-d') ?? '',
                    'score' => $score,
                    'maxScore' => $maxScore,
                    'percent' => $maxScore > 0 ? round(($score / $maxScore) * 100, 2) : 0,
                    'status' => $result->status,
                    'note' => $result->note ?? '',
                ];
            })
            ->all();
    }

    private function classSchedule(?Student $student): array
    {
        if (! $student?->schoolClass) {
            return [];
        }

        $class = $student->schoolClass()->with('teacher:id,name_en,name_kh')->first();

        if (! $class) {
            return [];
        }

        return [
            'className' => $class->name,
            'teacher' => $class->teacher?->name_en ?? $class->teacher?->name_kh ?? '',
            'room' => $class->room ?? '',
            'startsAt' => $class->starts_at ?? '',
            'endsAt' => $class->ends_at ?? '',
            'days' => $class->days ?? [],
        ];
    }

    private function learningMaterials(?Student $student): array
    {
        if (! $student || ! $student->school_class_id) {
            return [];
        }

        $homework = HomeworkAssignment::query()
            ->where('school_class_id', $student->school_class_id)
            ->whereNotNull('attachment_path')
            ->latest('due_on')
            ->get(['id', 'title_en', 'title_kh', 'attachment_path', 'attachment_name', 'due_on'])
            ->map(fn (HomeworkAssignment $assignment): array => [
                'id' => 'homework-'.$assignment->id,
                'title' => $assignment->title_en ?: $assignment->title_kh,
                'type' => 'Homework file',
                'date' => $assignment->due_on?->format('Y-m-d') ?? '',
                'description' => 'Class homework attachment',
                'fileName' => $assignment->attachment_name ?? 'Attachment',
                'fileUrl' => $assignment->attachment_path ? asset($assignment->attachment_path) : '',
                'hasFile' => true,
            ]);

        $exams = Exam::query()
            ->where('school_class_id', $student->school_class_id)
            ->whereNotNull('attachment_path')
            ->latest('exam_date')
            ->get(['id', 'title', 'subject', 'attachment_path', 'exam_date'])
            ->map(fn (Exam $exam): array => [
                'id' => 'exam-'.$exam->id,
                'title' => $exam->title,
                'type' => 'Exam file',
                'date' => $exam->exam_date?->format('Y-m-d') ?? '',
                'description' => $exam->subject ?? 'Exam material',
                'fileName' => 'Exam attachment',
                'fileUrl' => $exam->attachment_path ? asset($exam->attachment_path) : '',
                'hasFile' => true,
            ]);

        $lessons = LessonPlan::query()
            ->where('school_class_id', $student->school_class_id)
            ->whereNotNull('materials')
            ->latest('lesson_date')
            ->take(20)
            ->get(['id', 'title', 'materials', 'lesson_date'])
            ->map(fn (LessonPlan $lesson): array => [
                'id' => 'lesson-'.$lesson->id,
                'title' => $lesson->title,
                'type' => 'Lesson material',
                'date' => $lesson->lesson_date?->format('Y-m-d') ?? '',
                'description' => $lesson->materials ?? '',
                'fileName' => '',
                'fileUrl' => '',
                'hasFile' => false,
            ]);

        return $homework->concat($exams)->concat($lessons)->values()->all();
    }

    private function attendanceCalendarRecords(?Student $student): array
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
                'date' => $record->attendance_date,
                'period' => $record->period ?? 'Morning',
                'status' => $record->status,
                'note' => $record->note ?? '',
            ])
            ->all();
    }

    private function homeworkCalendarItems(?Student $student): array
    {
        if (! $student || ! $student->school_class_id) {
            return [];
        }

        $submissions = HomeworkSubmission::query()
            ->where('student_id', $student->id)
            ->get(['homework_assignment_id', 'status', 'submitted_at'])
            ->keyBy('homework_assignment_id');

        return HomeworkAssignment::query()
            ->where('school_class_id', $student->school_class_id)
            ->latest('due_on')
            ->get(['id', 'title_en', 'title_kh', 'points', 'due_on', 'status'])
            ->map(fn (HomeworkAssignment $assignment): array => [
                'id' => $assignment->id,
                'title' => $assignment->title_en ?: $assignment->title_kh,
                'due' => $assignment->due_on?->format('Y-m-d') ?? '',
                'points' => $assignment->points ?? 0,
                'status' => $assignment->status,
                'submissionStatus' => $submissions[$assignment->id]->status ?? 'pending',
                'submittedAt' => isset($submissions[$assignment->id])
                    ? $submissions[$assignment->id]->submitted_at?->format('Y-m-d') ?? ''
                    : '',
            ])
            ->all();
    }

    private function idCard(?Student $student): array
    {
        if (! $student) {
            return [];
        }

        return [
            'name' => $student->name_en,
            'nameKh' => $student->name_kh,
            'code' => $student->code,
            'photo' => $student->profile_photo ? asset($student->profile_photo) : null,
            'level' => $student->level?->name ?? '',
            'className' => $student->schoolClass?->name ?? '',
            'gender' => $student->gender ?? '',
            'enrolledOn' => $student->enrolled_on?->format('Y-m-d') ?? '',
        ];
    }

    private function allCertificates(?Student $student): array
    {
        if (! $student) {
            return [];
        }

        return Certificate::query()
            ->with(['level:id,name', 'student.schoolClass:id,name'])
            ->where('student_id', $student->id)
            ->where('status', 'issued')
            ->latest('issued_on')
            ->get()
            ->map(fn (Certificate $certificate): array => [
                'id' => $certificate->id,
                'title' => $certificate->title,
                'type' => $certificate->type,
                'academicYear' => $certificate->academic_year ?? '',
                'issuedOn' => $certificate->issued_on?->format('Y-m-d') ?? '',
                'certificateNumber' => $certificate->certificate_number,
                'level' => $certificate->level?->name ?? '',
                'className' => $certificate->student?->schoolClass?->name ?? '',
                'imageUrl' => $certificate->certificate_file_path ? asset($certificate->certificate_file_path) : '',
            ])
            ->all();
    }

    private function allNotifications(?Student $student, User $user): array
    {
        return Notification::query()
            ->where(function ($q) use ($student, $user): void {
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
            ->map(fn (Notification $n): array => $this->formatNotification($n))
            ->all();
    }

    private function canViewNotification(Notification $notification, ?Student $student, User $user): bool
    {
        if ($notification->student_id === null && $notification->user_id === null) {
            return true;
        }

        if ($notification->user_id === $user->id) {
            return true;
        }

        return $student !== null && $notification->student_id === $student->id;
    }

    /**
     * @return array<string, mixed>
     */
    private function formatNotification(Notification $notification): array
    {
        return [
            'id' => $notification->id,
            'routeKey' => $notification->routeKey(),
            'category' => $notification->category ?? 'general',
            'title' => $notification->title,
            'body' => $notification->body,
            'severity' => $notification->severity ?? 'info',
            'read' => $notification->read_at !== null,
            'createdAt' => $notification->created_at?->format('Y-m-d H:i') ?? '',
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function notificationTargetDetail(Notification $notification, ?Student $student): ?array
    {
        if (! $student || ! $student->school_class_id) {
            return null;
        }

        $data = $notification->data ?? [];

        if (($data['type'] ?? null) === 'homework_update' && isset($data['homework_assignment_id'])) {
            $homework = HomeworkAssignment::query()
                ->whereKey($data['homework_assignment_id'])
                ->where('school_class_id', $student->school_class_id)
                ->first();

            return $homework ? $this->homeworkDetail($homework, $student) : null;
        }

        if (($data['type'] ?? null) === 'class_message' && isset($data['lesson_plan_id'])) {
            $lessonPlan = LessonPlan::query()
                ->with('teacher:id,name_en,name_kh')
                ->whereKey($data['lesson_plan_id'])
                ->where('school_class_id', $student->school_class_id)
                ->first();

            return $lessonPlan ? $this->lessonPlanDetail($lessonPlan) : null;
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function homeworkDetail(HomeworkAssignment $homework, Student $student): array
    {
        $submission = HomeworkSubmission::query()
            ->where('homework_assignment_id', $homework->id)
            ->where('student_id', $student->id)
            ->first(['submitted_at', 'score', 'status', 'note', 'attachment_path', 'attachment_name']);

        return [
            'type' => 'homework',
            'routeKey' => $homework->routeKey(),
            'title' => $homework->title_en ?: $homework->title_kh,
            'titleKh' => $homework->title_kh ?? '',
            'instructions' => $homework->instructions ?? '',
            'points' => $homework->points ?? 0,
            'due' => $homework->due_on?->format('Y-m-d') ?? '',
            'status' => $homework->status,
            'attachmentName' => $homework->attachment_name ?? '',
            'attachmentUrl' => $homework->attachment_path ? asset($homework->attachment_path) : '',
            'submission' => $submission ? [
                'submitted' => $submission->submitted_at?->format('Y-m-d') ?? '',
                'score' => $submission->score,
                'status' => $submission->status,
                'note' => $submission->note ?? '',
                'attachmentName' => $submission->attachment_name ?? '',
                'attachmentUrl' => $submission->attachment_path ? asset($submission->attachment_path) : '',
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function lessonPlanDetail(LessonPlan $lessonPlan): array
    {
        return [
            'type' => 'lesson_plan',
            'title' => $lessonPlan->title,
            'lessonDate' => $lessonPlan->lesson_date?->format('Y-m-d') ?? '',
            'teacher' => $lessonPlan->teacher?->name_en ?? $lessonPlan->teacher?->name_kh ?? '',
            'objective' => $lessonPlan->objective ?? '',
            'content' => $lessonPlan->content ?? '',
            'materials' => $lessonPlan->materials ?? '',
            'homework' => $lessonPlan->homework ?? '',
            'status' => $lessonPlan->status,
        ];
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
