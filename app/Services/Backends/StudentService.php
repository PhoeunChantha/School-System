<?php

namespace App\Services\Backends;

use App\Models\Level;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
     * @return array<string, mixed>
     */
    public function showData(Student $student): array
    {
        $student->load([
            'level:id,name',
            'schoolClass:id,name,room,starts_at,ends_at,days',
            'schoolClass.teacher:id,name_en',
            'gradeRecords.gradePeriod:id,name,type',
            'attendanceRecords' => fn ($q) => $q->with('attendanceSession:id,attendance_date,period')->latest('id')->limit(50),
            'feeCharges' => fn ($q) => $q->with('payments')->orderByDesc('billing_month'),
            'homeworkSubmissions.homeworkAssignment:id,title_en,title_kh,points,due_on',
            'certificates',
        ]);

        $totalAtt = $student->attendanceRecords->count();
        $presentAtt = $student->attendanceRecords->whereIn('status', ['present', 'late', 'excused'])->count();
        $attendanceRate = $totalAtt > 0 ? (int) round(($presentAtt / $totalAtt) * 100) : 100;

        return [
            'student' => [
                'id' => $student->id,
                'code' => $student->code,
                'photo' => $student->profile_photo ? asset($student->profile_photo) : null,
                'nameKh' => $student->name_kh,
                'nameEn' => $student->name_en,
                'gender' => $student->gender,
                'dateOfBirth' => $student->date_of_birth?->format('Y-m-d'),
                'age' => $student->date_of_birth ? (int) $student->date_of_birth->diffInYears(now()) : null,
                'province' => $student->province,
                'district' => $student->district,
                'commune' => $student->commune,
                'village' => $student->village,
                'parentPhone' => $student->parent_phone,
                'telegram' => $student->telegram_username,
                'level' => $student->level?->name ?? '—',
                'class' => $student->schoolClass?->name ?? '—',
                'teacher' => $student->schoolClass?->teacher?->name_en ?? '—',
                'room' => $student->schoolClass?->room ?? '—',
                'schedule' => collect([$student->schoolClass?->starts_at, $student->schoolClass?->ends_at])->filter()->implode('–'),
                'days' => implode(', ', array_map('ucfirst', $student->schoolClass?->days ?? [])),
                'monthlyFee' => (float) $student->monthly_fee,
                'scholarshipAmount' => (float) $student->scholarship_amount,
                'feeStatus' => match ($student->fee_status) {
                    'paid' => 'Paid', 'partial' => 'Partial', default => 'Unpaid'
                },
                'status' => $student->status,
                'enrolledOn' => $student->enrolled_on?->format('Y-m-d'),
                'attendanceRate' => $attendanceRate,
            ],
            'grades' => $student->gradeRecords
                ->sortByDesc('graded_at')
                ->values()
                ->map(fn ($gr) => [
                    'id' => $gr->id,
                    'period' => $gr->gradePeriod?->name ?? '—',
                    'type' => $gr->gradePeriod?->type ?? '',
                    'speaking' => (int) ($gr->speaking ?? 0),
                    'listening' => (int) ($gr->listening ?? 0),
                    'reading' => (int) ($gr->reading ?? 0),
                    'writing' => (int) ($gr->writing ?? 0),
                    'average' => round((float) ($gr->average ?? 0), 1),
                    'gradedAt' => $gr->graded_at?->format('Y-m-d'),
                ])->all(),
            'attendance' => $student->attendanceRecords
                ->map(fn ($ar) => [
                    'id' => $ar->id,
                    'date' => $ar->attendanceSession?->attendance_date,
                    'period' => $ar->attendanceSession?->period ?? '',
                    'status' => $ar->status,
                    'note' => $ar->note,
                ])->all(),
            'fees' => $student->feeCharges->map(fn ($fc) => [
                'id' => $fc->id,
                'billingMonth' => $fc->billing_month,
                'amount' => (float) $fc->amount,
                'discountAmount' => (float) $fc->discount_amount,
                'paidAmount' => (float) $fc->paid_amount,
                'status' => $fc->status,
                'dueOn' => $fc->due_on,
                'payments' => $fc->payments->map(fn ($p) => [
                    'id' => $p->id,
                    'amount' => (float) $p->amount,
                    'method' => ucfirst($p->method),
                    'paidOn' => $p->paid_on,
                    'reference' => $p->reference,
                ])->all(),
            ])->all(),
            'homework' => $student->homeworkSubmissions->map(fn ($hs) => [
                'id' => $hs->id,
                'title' => $hs->homeworkAssignment?->title_en ?? '—',
                'points' => $hs->homeworkAssignment?->points ?? 0,
                'dueOn' => $hs->homeworkAssignment?->due_on,
                'score' => $hs->score,
                'status' => $hs->status,
                'submittedAt' => $hs->submitted_at,
            ])->all(),
            'certificates' => $student->certificates->map(fn ($c) => [
                'id' => $c->id,
                'type' => $c->type,
                'title' => $c->title,
                'number' => $c->certificate_number,
                'issuedOn' => $c->issued_on?->format('Y-m-d'),
                'status' => $c->status,
            ])->all(),
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
        $photoPath = $this->storePhoto($data['profile_photo'] ?? null);

        return DB::transaction(fn (): Student => Student::create([
            ...$this->normalizedData($data),
            'profile_photo' => $photoPath,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Student $student, array $data, ?int $userId): Student
    {
        $photoPath = $student->profile_photo;

        if (isset($data['profile_photo']) && $data['profile_photo'] instanceof UploadedFile) {
            $this->deletePhoto($student->profile_photo);
            $photoPath = $this->storePhoto($data['profile_photo']);
        }

        return DB::transaction(function () use ($student, $data, $userId, $photoPath): Student {
            $student->update([
                ...$this->normalizedData($data),
                'profile_photo' => $photoPath,
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
            'photo' => $student->profile_photo ? asset($student->profile_photo) : null,
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
            'profile_photo_url' => $student->profile_photo ? asset('uploads/students/'.basename($student->profile_photo)) : null,
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

    private function storePhoto(?UploadedFile $file): ?string
    {
        if (! $file) {
            return null;
        }

        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $destination = public_path('uploads/students');

        if (! is_dir($destination)) {
            mkdir($destination, 0755, true);
        }

        $file->move($destination, $filename);

        return 'uploads/students/'.$filename;
    }

    private function deletePhoto(?string $path): void
    {
        if ($path && file_exists(public_path($path))) {
            unlink(public_path($path));
        }
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
