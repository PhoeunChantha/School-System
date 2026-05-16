<?php

namespace App\Services\Backends;

use App\Models\Level;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StudentService
{
    /**
     * @var array<int, string>
     */
    public const IMPORT_COLUMNS = [
        'code',
        'name_kh',
        'name_en',
        'level',
        'class',
        'date_of_birth',
        'gender',
        'province',
        'district',
        'commune',
        'village',
        'parent_phone',
        'telegram_username',
        'monthly_fee',
        'scholarship_amount',
        'fee_status',
        'status',
        'enrolled_on',
    ];

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
                'routeKey' => $student->routeKey(),
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
                    'routeKey' => $gr->routeKey(),
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
                'routeKey' => $fc->routeKey(),
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
                'routeKey' => $hs->routeKey(),
                'title' => $hs->homeworkAssignment?->title_en ?? '—',
                'points' => $hs->homeworkAssignment?->points ?? 0,
                'dueOn' => $hs->homeworkAssignment?->due_on,
                'score' => $hs->score,
                'status' => $hs->status,
                'submittedAt' => $hs->submitted_at,
            ])->all(),
            'certificates' => $student->certificates->map(fn ($c) => [
                'id' => $c->id,
                'routeKey' => $c->routeKey(),
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
     * @return array{created: int, updated: int, skipped: int}
     */
    public function import(UploadedFile $file, ?int $userId): array
    {
        $summary = ['created' => 0, 'updated' => 0, 'skipped' => 0];

        foreach ($this->csvRows($file) as $row) {
            $data = $this->studentImportData($row);

            $validator = Validator::make($data, [
                'level_id' => ['nullable', 'integer', Rule::exists('levels', 'id')],
                'school_class_id' => ['nullable', 'integer', Rule::exists('school_classes', 'id')],
                'code' => ['nullable', 'string', 'max:255'],
                'name_kh' => ['required', 'string', 'max:255'],
                'name_en' => ['required', 'string', 'max:255'],
                'date_of_birth' => ['nullable', 'date'],
                'gender' => ['nullable', 'string', Rule::in(['male', 'female'])],
                'province' => ['nullable', 'string', 'max:255'],
                'district' => ['nullable', 'string', 'max:255'],
                'commune' => ['nullable', 'string', 'max:255'],
                'village' => ['nullable', 'string', 'max:255'],
                'parent_phone' => ['nullable', 'string', 'max:255'],
                'telegram_username' => ['nullable', 'string', 'max:255'],
                'monthly_fee' => ['required', 'numeric', 'min:0', 'max:999999.99'],
                'scholarship_amount' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
                'fee_status' => ['required', 'string', Rule::in(['paid', 'unpaid', 'partial'])],
                'status' => ['required', 'string', Rule::in(['active', 'inactive'])],
                'enrolled_on' => ['nullable', 'date'],
            ]);

            if ($validator->fails()) {
                $summary['skipped']++;

                continue;
            }

            DB::transaction(function () use ($data, $userId, &$summary): void {
                $student = filled($data['code'] ?? null)
                    ? Student::query()->withTrashed()->where('code', $data['code'])->first()
                    : null;

                if ($student) {
                    $student->restore();
                    $student->update([
                        ...$this->normalizedData($data),
                        'updated_by' => $userId,
                    ]);
                    $summary['updated']++;

                    return;
                }

                Student::create([
                    ...$this->normalizedData($data),
                    'created_by' => $userId,
                    'updated_by' => $userId,
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
        return Student::query()
            ->with(['level:id,name', 'schoolClass:id,name'])
            ->orderBy('name_en')
            ->get()
            ->map(fn (Student $student): array => [
                $student->code,
                $student->name_kh,
                $student->name_en,
                $student->level?->name,
                $student->schoolClass?->name,
                $student->date_of_birth?->format('Y-m-d'),
                $student->gender,
                $student->province,
                $student->district,
                $student->commune,
                $student->village,
                $student->parent_phone,
                $student->telegram_username,
                $student->monthly_fee,
                $student->scholarship_amount,
                $student->fee_status,
                $student->status,
                $student->enrolled_on?->format('Y-m-d'),
            ])
            ->all();
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
                $headers = array_map(fn (string $header): string => Str::of($header)->trim("\xEF\xBB\xBF \t\n\r\0\x0B")->lower()->replace(' ', '_')->toString(), $row);

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
    private function studentImportData(array $row): array
    {
        return [
            'code' => $this->emptyToNull($row['code'] ?? null),
            'name_kh' => $this->emptyToNull($row['name_kh'] ?? null),
            'name_en' => $this->emptyToNull($row['name_en'] ?? null),
            'level_id' => $this->levelId($row['level'] ?? null),
            'school_class_id' => $this->classId($row['class'] ?? null),
            'date_of_birth' => $this->emptyToNull($row['date_of_birth'] ?? null),
            'gender' => Str::lower((string) $this->emptyToNull($row['gender'] ?? null)) ?: null,
            'province' => $this->emptyToNull($row['province'] ?? null),
            'district' => $this->emptyToNull($row['district'] ?? null),
            'commune' => $this->emptyToNull($row['commune'] ?? null),
            'village' => $this->emptyToNull($row['village'] ?? null),
            'parent_phone' => $this->emptyToNull($row['parent_phone'] ?? null),
            'telegram_username' => $this->emptyToNull($row['telegram_username'] ?? null),
            'monthly_fee' => $this->emptyToNull($row['monthly_fee'] ?? null),
            'scholarship_amount' => $this->emptyToNull($row['scholarship_amount'] ?? null) ?? 0,
            'fee_status' => Str::lower((string) ($this->emptyToNull($row['fee_status'] ?? null) ?? 'unpaid')),
            'status' => Str::lower((string) ($this->emptyToNull($row['status'] ?? null) ?? 'active')),
            'enrolled_on' => $this->emptyToNull($row['enrolled_on'] ?? null),
        ];
    }

    private function levelId(?string $name): ?int
    {
        $name = $this->emptyToNull($name);

        return $name ? Level::query()->where('name', $name)->value('id') : null;
    }

    private function classId(?string $name): ?int
    {
        $name = $this->emptyToNull($name);

        return $name ? SchoolClass::query()->where('name', $name)->value('id') : null;
    }

    private function emptyToNull(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
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
            'routeKey' => $student->routeKey(),
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
            'routeKey' => $student->routeKey(),
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
