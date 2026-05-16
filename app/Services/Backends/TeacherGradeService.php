<?php

namespace App\Services\Backends;

use App\Models\GradePeriod;
use App\Models\GradeRecord;
use App\Models\HomeworkSubmission;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TeacherGradeService
{
    /**
     * @return array<string, mixed>
     */
    public function indexData(Teacher $teacher): array
    {
        $teacher->load([
            'schoolClasses' => fn ($query) => $query
                ->active()
                ->with(['students' => fn ($studentQuery) => $studentQuery
                    ->active()
                    ->with('level:id,name')
                    ->orderBy('name_en')])
                ->orderBy('name'),
        ]);

        $classIds = $teacher->schoolClasses->pluck('id');
        $studentIds = $teacher->schoolClasses
            ->flatMap(fn (SchoolClass $schoolClass) => $schoolClass->students->pluck('id'))
            ->values();
        $homeworkScores = $this->homeworkScores($studentIds->all(), $classIds->all());

        $periods = GradePeriod::query()
            ->orderByDesc('is_current')
            ->latest('starts_on')
            ->latest('id')
            ->get(['id', 'name', 'type', 'academic_year', 'is_current']);

        $currentPeriod = $periods->firstWhere('is_current', true) ?? $periods->first();

        $records = GradeRecord::query()
            ->with(['gradePeriod:id,name', 'student:id,name_kh,name_en,profile_photo,school_class_id', 'schoolClass:id,name'])
            ->whereIn('student_id', $studentIds)
            ->latest('average')
            ->latest('id')
            ->get();

        return [
            'teacher' => [
                'id' => $teacher->id,
                'routeKey' => $teacher->routeKey(),
                'nameKh' => $teacher->name_kh,
                'nameEn' => $teacher->name_en,
                'photo' => $teacher->profile_photo ? asset($teacher->profile_photo) : null,
                'subject' => $teacher->subject ?? '',
            ],
            'periods' => $periods->map(fn (GradePeriod $period): array => [
                'id' => $period->id,
                'name' => $period->name,
                'type' => $period->type,
                'academicYear' => $period->academic_year ?? '',
                'isCurrent' => $period->is_current,
            ]),
            'classes' => $teacher->schoolClasses->map(fn (SchoolClass $schoolClass): array => [
                'id' => $schoolClass->id,
                'routeKey' => $schoolClass->routeKey(),
                'name' => $schoolClass->name,
                'room' => $schoolClass->room ?? '',
                'students' => $schoolClass->students->count(),
            ]),
            'students' => $teacher->schoolClasses
                ->flatMap(fn (SchoolClass $schoolClass) => $schoolClass->students->map(fn (Student $student): array => [
                    'id' => $student->id,
                    'routeKey' => $student->routeKey(),
                    'schoolClassId' => $schoolClass->id,
                    'className' => $schoolClass->name,
                    'nameKh' => $student->name_kh,
                    'nameEn' => $student->name_en,
                    'photo' => $student->profile_photo ? asset($student->profile_photo) : null,
                    'level' => $student->level?->name ?? '',
                    'homework' => $homeworkScores[$student->id] ?? $this->emptyHomeworkScore(),
                ]))
                ->values(),
            'records' => $records->map(fn (GradeRecord $record): array => $this->recordPayload($record)),
            'summary' => [
                'currentPeriodId' => $currentPeriod?->id,
                'classCount' => $classIds->count(),
                'studentCount' => $studentIds->count(),
                'recordCount' => $records->when($currentPeriod, fn ($collection) => $collection->where('grade_period_id', $currentPeriod->id))->count(),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function save(Teacher $teacher, array $data, ?int $userId): GradeRecord
    {
        $student = Student::query()
            ->active()
            ->whereKey($data['student_id'])
            ->whereHas('schoolClass', fn ($query) => $query->where('teacher_id', $teacher->id))
            ->first();

        if (! $student) {
            throw ValidationException::withMessages([
                'student_id' => 'Please select a student assigned to this teacher.',
            ]);
        }

        if ((int) $data['school_class_id'] !== (int) $student->school_class_id) {
            throw ValidationException::withMessages([
                'school_class_id' => 'Please select the class assigned to this student.',
            ]);
        }

        $scores = [
            'speaking' => (int) $data['speaking'],
            'listening' => (int) $data['listening'],
            'reading' => (int) $data['reading'],
            'writing' => (int) $data['writing'],
        ];

        return DB::transaction(fn (): GradeRecord => GradeRecord::query()->updateOrCreate(
            [
                'grade_period_id' => $data['grade_period_id'],
                'student_id' => $student->id,
            ],
            [
                'school_class_id' => $student->school_class_id,
                ...$scores,
                'average' => round(array_sum($scores) / count($scores), 2),
                'graded_by' => $userId,
                'updated_by' => $userId,
                'graded_at' => now(),
            ],
        ));
    }

    /**
     * @return array<string, mixed>
     */
    private function recordPayload(GradeRecord $record): array
    {
        return [
            'id' => $record->id,
            'routeKey' => $record->routeKey(),
            'gradePeriodId' => $record->grade_period_id,
            'periodName' => $record->gradePeriod?->name ?? '',
            'studentId' => $record->student_id,
            'schoolClassId' => $record->school_class_id,
            'className' => $record->schoolClass?->name ?? '',
            'studentNameKh' => $record->student?->name_kh ?? '',
            'studentNameEn' => $record->student?->name_en ?? 'Unknown student',
            'studentPhoto' => $record->student?->profile_photo ? asset($record->student->profile_photo) : null,
            'speaking' => $record->speaking,
            'listening' => $record->listening,
            'reading' => $record->reading,
            'writing' => $record->writing,
            'average' => (float) $record->average,
            'gradedAt' => $record->graded_at?->format('Y-m-d H:i') ?? '',
        ];
    }

    /**
     * @param  array<int, int>  $studentIds
     * @param  array<int, int>  $classIds
     * @return array<int, array{average: float, earned: int, points: int, count: int}>
     */
    private function homeworkScores(array $studentIds, array $classIds): array
    {
        if ($studentIds === [] || $classIds === []) {
            return [];
        }

        return HomeworkSubmission::query()
            ->with('homeworkAssignment:id,school_class_id,points')
            ->whereIn('student_id', $studentIds)
            ->whereNotNull('score')
            ->whereHas('homeworkAssignment', fn ($query) => $query->whereIn('school_class_id', $classIds))
            ->get(['id', 'homework_assignment_id', 'student_id', 'score'])
            ->groupBy('student_id')
            ->map(function ($submissions): array {
                $earned = (int) $submissions->sum('score');
                $points = (int) $submissions->sum(fn (HomeworkSubmission $submission): int => (int) ($submission->homeworkAssignment?->points ?? 0));

                return [
                    'average' => $points > 0 ? round(($earned / $points) * 100, 2) : 0,
                    'earned' => $earned,
                    'points' => $points,
                    'count' => $submissions->count(),
                ];
            })
            ->all();
    }

    /**
     * @return array{average: float, earned: int, points: int, count: int}
     */
    private function emptyHomeworkScore(): array
    {
        return [
            'average' => 0,
            'earned' => 0,
            'points' => 0,
            'count' => 0,
        ];
    }
}
