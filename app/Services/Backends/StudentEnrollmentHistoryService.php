<?php

namespace App\Services\Backends;

use App\Models\Student;
use App\Models\StudentEnrollmentHistory;

class StudentEnrollmentHistoryService
{
    /** @return array<string, mixed> */
    public function indexData(): array
    {
        $histories = StudentEnrollmentHistory::query()
            ->with($this->relations())
            ->latest('effective_on')
            ->latest('id')
            ->get()
            ->map(fn (StudentEnrollmentHistory $history): array => $this->payload($history));

        return [
            'histories' => $histories,
            'summary' => [
                'total' => $histories->count(),
                'enrolled' => $histories->where('eventType', 'enrolled')->count(),
                'promotions' => $histories->where('eventType', 'promotion')->count(),
                'transfers' => $histories->where('eventType', 'transfer')->count(),
                'withdrawals' => $histories->where('eventType', 'withdrawal')->count(),
            ],
        ];
    }

    /** @return array<int, array<string, mixed>> */
    public function forStudent(Student $student): array
    {
        return $student->enrollmentHistories()
            ->with($this->relations(includeStudent: false))
            ->latest('effective_on')
            ->latest('id')
            ->get()
            ->map(fn (StudentEnrollmentHistory $history): array => $this->payload($history, $student))
            ->all();
    }

    public function recordCreated(Student $student): void
    {
        StudentEnrollmentHistory::query()->create([
            'student_id' => $student->id,
            'event_type' => 'enrolled',
            'to_level_id' => $student->level_id,
            'to_school_class_id' => $student->school_class_id,
            'to_status' => $student->status,
            'effective_on' => $student->enrolled_on ?? now()->toDateString(),
            'note' => 'Initial student enrollment',
            'changed_by' => $student->created_by,
        ]);
    }

    public function recordUpdated(Student $student): void
    {
        if (! $student->wasChanged(['level_id', 'school_class_id', 'status'])) {
            return;
        }

        $oldLevelId = $student->getOriginal('level_id');
        $oldClassId = $student->getOriginal('school_class_id');
        $oldStatus = $student->getOriginal('status');

        StudentEnrollmentHistory::query()->create([
            'student_id' => $student->id,
            'event_type' => $this->eventType($student, $oldLevelId, $oldClassId, $oldStatus),
            'from_level_id' => $oldLevelId,
            'to_level_id' => $student->level_id,
            'from_school_class_id' => $oldClassId,
            'to_school_class_id' => $student->school_class_id,
            'from_status' => $oldStatus,
            'to_status' => $student->status,
            'effective_on' => now()->toDateString(),
            'changed_by' => $student->updated_by,
        ]);
    }

    public function recordDeleted(Student $student): void
    {
        StudentEnrollmentHistory::query()->create([
            'student_id' => $student->id,
            'event_type' => 'withdrawal',
            'from_level_id' => $student->level_id,
            'to_level_id' => $student->level_id,
            'from_school_class_id' => $student->school_class_id,
            'to_school_class_id' => $student->school_class_id,
            'from_status' => $student->status,
            'to_status' => 'withdrawn',
            'effective_on' => now()->toDateString(),
            'note' => 'Student record archived',
            'changed_by' => $student->updated_by,
        ]);
    }

    private function eventType(Student $student, mixed $oldLevelId, mixed $oldClassId, mixed $oldStatus): string
    {
        if ($oldStatus === 'active' && $student->status !== 'active') {
            return 'withdrawal';
        }

        if ($oldStatus !== 'active' && $student->status === 'active') {
            return 'reactivated';
        }

        if ((int) $oldLevelId !== (int) $student->level_id) {
            return 'promotion';
        }

        if ((int) $oldClassId !== (int) $student->school_class_id) {
            return 'transfer';
        }

        return 'status-change';
    }

    /** @return array<int, string> */
    private function relations(bool $includeStudent = true): array
    {
        $relations = [
            'fromLevel:id,name',
            'toLevel:id,name',
            'fromSchoolClass:id,name',
            'toSchoolClass:id,name',
            'changedByUser:id,name,email',
        ];

        if ($includeStudent) {
            array_unshift($relations, 'student:id,name_en,name_kh,code');
        }

        return $relations;
    }

    /** @return array<string, mixed> */
    private function payload(StudentEnrollmentHistory $history, ?Student $student = null): array
    {
        $student ??= $history->student;

        return [
            'id' => $history->id,
            'routeKey' => $history->routeKey(),
            'studentName' => $student?->name_en ?? $student?->name_kh ?? 'Unknown student',
            'studentCode' => $student?->code ?? '',
            'eventType' => $history->event_type,
            'fromLevel' => $history->fromLevel?->name ?? '',
            'toLevel' => $history->toLevel?->name ?? '',
            'fromClass' => $history->fromSchoolClass?->name ?? '',
            'toClass' => $history->toSchoolClass?->name ?? '',
            'fromStatus' => $history->from_status ?? '',
            'toStatus' => $history->to_status ?? '',
            'effectiveOn' => $history->effective_on?->format('Y-m-d'),
            'note' => $history->note ?? '',
            'changedBy' => $history->changedByUser?->name ?? 'System',
            'createdAt' => $history->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
