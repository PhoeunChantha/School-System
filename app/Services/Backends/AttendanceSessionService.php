<?php

namespace App\Services\Backends;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\SchoolClass;
use Illuminate\Support\Facades\DB;

class AttendanceSessionService
{
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
}
