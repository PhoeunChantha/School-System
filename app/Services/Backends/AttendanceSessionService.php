<?php

namespace App\Services\Backends;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AttendanceSessionService
{
    /**
     * @var array<int, string>
     */
    public const IMPORT_COLUMNS = [
        'class',
        'attendance_date',
        'period',
        'student_code',
        'student_name_en',
        'status',
        'note',
    ];

    /**
     * @return array{sessions: mixed, classes: mixed, summary: array<string, mixed>}
     */
    public function indexData(): array
    {
        $sessions = AttendanceSession::query()
            ->with([
                'schoolClass:id,name',
                'records:id,attendance_session_id,student_id,status,note',
                'records.student:id,name_kh,name_en,school_class_id,province',
            ])
            ->latest('attendance_date')
            ->latest('id')
            ->get()
            ->map(fn (AttendanceSession $session): array => $this->sessionPayload($session));

        return [
            'sessions' => $sessions,
            'classes' => SchoolClass::query()
                ->active()
                ->with(['students' => fn ($query) => $query->active()->orderBy('name_en')->select(['id', 'school_class_id', 'name_kh', 'name_en', 'province'])])
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (SchoolClass $schoolClass): array => [
                    'id' => $schoolClass->id,
                    'name' => $schoolClass->name,
                    'students' => $schoolClass->students->map(fn ($student): array => [
                        'id' => $student->id,
                        'nameKh' => $student->name_kh,
                        'nameEn' => $student->name_en,
                        'province' => $student->province ?? '',
                    ]),
                ]),
            'summary' => [
                'sessionCount' => $sessions->count(),
                'presentCount' => $sessions->sum('presentCount'),
                'absentCount' => $sessions->sum('absentCount'),
                'lateCount' => $sessions->sum('lateCount'),
                'excusedCount' => $sessions->sum('excusedCount'),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): AttendanceSession
    {
        return DB::transaction(function () use ($data, $userId): AttendanceSession {
            $session = AttendanceSession::create([
                'school_class_id' => $data['school_class_id'],
                'attendance_date' => $data['attendance_date'],
                'period' => $data['period'],
                'marked_by' => $userId,
                'created_by' => $userId,
                'updated_by' => $userId,
                'marked_at' => now(),
            ]);

            $this->syncRecords($session, $data['records']);

            return $session->refresh();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(AttendanceSession $session, array $data, ?int $userId): AttendanceSession
    {
        return DB::transaction(function () use ($session, $data, $userId): AttendanceSession {
            $session->update([
                'school_class_id' => $data['school_class_id'],
                'attendance_date' => $data['attendance_date'],
                'period' => $data['period'],
                'marked_by' => $userId,
                'updated_by' => $userId,
                'marked_at' => now(),
            ]);

            $this->syncRecords($session, $data['records']);

            return $session->refresh();
        });
    }

    public function delete(AttendanceSession $session): void
    {
        DB::transaction(fn (): ?bool => $session->delete());
    }

    /**
     * @return array{created: int, updated: int, skipped: int}
     */
    public function import(UploadedFile $file, ?int $userId): array
    {
        $summary = ['created' => 0, 'updated' => 0, 'skipped' => 0];

        foreach ($this->csvRows($file) as $row) {
            $data = $this->attendanceImportData($row);

            $validator = Validator::make($data, [
                'school_class_id' => ['required', 'integer', Rule::exists('school_classes', 'id')->whereNull('deleted_at')],
                'attendance_date' => ['required', 'date'],
                'period' => ['required', 'string', Rule::in(['morning', 'afternoon', 'evening', 'full_day'])],
                'student_id' => ['required', 'integer', Rule::exists('students', 'id')->whereNull('deleted_at')],
                'status' => ['required', 'string', Rule::in(['present', 'absent', 'late', 'excused'])],
                'note' => ['nullable', 'string', 'max:255'],
            ]);

            if ($validator->fails()) {
                $summary['skipped']++;

                continue;
            }

            DB::transaction(function () use ($data, $userId, &$summary): void {
                $session = AttendanceSession::query()->firstOrCreate(
                    [
                        'school_class_id' => $data['school_class_id'],
                        'attendance_date' => $data['attendance_date'],
                        'period' => $data['period'],
                    ],
                    [
                        'marked_by' => $userId,
                        'created_by' => $userId,
                        'updated_by' => $userId,
                        'marked_at' => now(),
                    ],
                );

                if (! $session->wasRecentlyCreated) {
                    $session->update([
                        'marked_by' => $userId,
                        'updated_by' => $userId,
                        'marked_at' => now(),
                    ]);
                }

                $record = AttendanceRecord::query()
                    ->where('attendance_session_id', $session->id)
                    ->where('student_id', $data['student_id'])
                    ->first();

                if ($record) {
                    $record->update([
                        'status' => $data['status'],
                        'note' => $data['note'] ?? null,
                    ]);
                    $summary['updated']++;

                    return;
                }

                AttendanceRecord::create([
                    'attendance_session_id' => $session->id,
                    'student_id' => $data['student_id'],
                    'status' => $data['status'],
                    'note' => $data['note'] ?? null,
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
        return AttendanceSession::query()
            ->with([
                'schoolClass:id,name',
                'records.student:id,code,name_en',
            ])
            ->latest('attendance_date')
            ->latest('id')
            ->get()
            ->flatMap(fn (AttendanceSession $session) => $session->records->map(fn (AttendanceRecord $record): array => [
                $session->schoolClass?->name ?? '',
                $session->attendance_date?->format('Y-m-d') ?? '',
                $session->period ?? '',
                $record->student?->code ?? '',
                $record->student?->name_en ?? '',
                $record->status,
                $record->note ?? '',
            ]))
            ->all();
    }

    /**
     * @param  array<int, array<string, mixed>>  $records
     */
    private function syncRecords(AttendanceSession $session, array $records): void
    {
        $studentIds = collect($records)->pluck('student_id')->all();

        AttendanceRecord::query()
            ->where('attendance_session_id', $session->id)
            ->whereNotIn('student_id', $studentIds)
            ->delete();

        foreach ($records as $record) {
            AttendanceRecord::updateOrCreate(
                [
                    'attendance_session_id' => $session->id,
                    'student_id' => $record['student_id'],
                ],
                [
                    'status' => $record['status'],
                    'note' => $record['note'] ?? null,
                ],
            );
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function sessionPayload(AttendanceSession $session): array
    {
        $records = $session->records;

        return [
            'id' => $session->id,
            'schoolClassId' => $session->school_class_id,
            'className' => $session->schoolClass?->name ?? '',
            'attendanceDate' => $session->attendance_date?->format('Y-m-d') ?? '',
            'period' => $session->period ?? '',
            'markedAt' => $session->marked_at?->format('Y-m-d H:i') ?? '',
            'presentCount' => $records->where('status', 'present')->count(),
            'absentCount' => $records->where('status', 'absent')->count(),
            'lateCount' => $records->where('status', 'late')->count(),
            'excusedCount' => $records->where('status', 'excused')->count(),
            'records' => $records->map(fn (AttendanceRecord $record): array => [
                'id' => $record->id,
                'studentId' => $record->student_id,
                'studentNameKh' => $record->student?->name_kh ?? '',
                'studentNameEn' => $record->student?->name_en ?? 'Unknown student',
                'province' => $record->student?->province ?? '',
                'status' => $record->status,
                'note' => $record->note ?? '',
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
                $headers = array_map(
                    fn (string $header): string => Str::of($header)->trim("\xEF\xBB\xBF \t\n\r\0\x0B")->lower()->replace(' ', '_')->toString(),
                    $row,
                );

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
    private function attendanceImportData(array $row): array
    {
        $schoolClassId = $this->classId($row['class'] ?? null);

        return [
            'school_class_id' => $schoolClassId,
            'attendance_date' => $this->emptyToNull($row['attendance_date'] ?? null),
            'period' => Str::lower((string) ($this->emptyToNull($row['period'] ?? null) ?? 'morning')),
            'student_id' => $this->studentId(
                $schoolClassId,
                $row['student_code'] ?? null,
                $row['student_name_en'] ?? null,
            ),
            'status' => Str::lower((string) ($this->emptyToNull($row['status'] ?? null) ?? 'present')),
            'note' => $this->emptyToNull($row['note'] ?? null),
        ];
    }

    private function classId(?string $name): ?int
    {
        $name = $this->emptyToNull($name);

        return $name
            ? SchoolClass::query()->where('name', $name)->whereNull('deleted_at')->value('id')
            : null;
    }

    private function studentId(?int $schoolClassId, ?string $code, ?string $nameEn): ?int
    {
        if (! $schoolClassId) {
            return null;
        }

        $code = $this->emptyToNull($code);
        if ($code) {
            return Student::query()
                ->where('school_class_id', $schoolClassId)
                ->where('code', $code)
                ->whereNull('deleted_at')
                ->value('id');
        }

        $nameEn = $this->emptyToNull($nameEn);
        if (! $nameEn) {
            return null;
        }

        return Student::query()
            ->where('school_class_id', $schoolClassId)
            ->where('name_en', $nameEn)
            ->whereNull('deleted_at')
            ->value('id');
    }

    private function emptyToNull(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
