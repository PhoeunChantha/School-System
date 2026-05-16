<?php

namespace App\Services\Backends;

use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Student;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ExamResultService
{
    /**
     * @return array{results: mixed, exams: mixed, students: mixed, summary: array<string, mixed>}
     */
    public function indexData(): array
    {
        $results = ExamResult::query()
            ->with([
                'exam:id,title,subject,exam_date',
                'student:id,name_kh,name_en,level_id,school_class_id',
                'student.level:id,name',
                'student.schoolClass:id,name',
            ])
            ->latest()
            ->get()
            ->map(fn (ExamResult $examResult): array => $this->resultPayload($examResult));

        return [
            'results' => $results,
            'exams' => $this->examOptions(),
            'students' => $this->studentOptions(),
            'summary' => [
                'resultCount' => $results->count(),
                'passedCount' => $results->where('status', 'passed')->count(),
                'failedCount' => $results->where('status', 'failed')->count(),
                'pendingCount' => $results->where('status', 'pending')->count(),
                'averagePercent' => round((float) $results->avg('percent'), 2),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): ExamResult
    {
        try {
            return DB::transaction(fn (): ExamResult => ExamResult::create([
                ...$this->normalizedData($data),
                'created_by' => $userId,
                'updated_by' => $userId,
            ]));
        } catch (QueryException $exception) {
            if ((string) $exception->getCode() === '23000') {
                throw ValidationException::withMessages([
                    'student_id' => 'This student already has a result for the selected exam.',
                ]);
            }

            throw $exception;
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ExamResult $examResult, array $data, ?int $userId): ExamResult
    {
        try {
            return DB::transaction(function () use ($examResult, $data, $userId): ExamResult {
                $examResult->update([
                    ...$this->normalizedData($data),
                    'updated_by' => $userId,
                ]);

                return $examResult->refresh();
            });
        } catch (QueryException $exception) {
            if ((string) $exception->getCode() === '23000') {
                throw ValidationException::withMessages([
                    'student_id' => 'This student already has a result for the selected exam.',
                ]);
            }

            throw $exception;
        }
    }

    public function delete(ExamResult $examResult): void
    {
        DB::transaction(fn (): ?bool => $examResult->delete());
    }

    /**
     * @return mixed
     */
    private function examOptions()
    {
        return Exam::query()
            ->latest('exam_date')
            ->latest('id')
            ->get(['id', 'title', 'subject', 'exam_date'])
            ->map(fn (Exam $exam): array => [
                'id' => $exam->id,
                'routeKey' => $exam->routeKey(),
                'title' => $exam->title,
                'subject' => $exam->subject ?? '',
                'examDate' => $exam->exam_date?->format('Y-m-d') ?? '',
            ]);
    }

    /**
     * @return mixed
     */
    private function studentOptions()
    {
        return Student::query()
            ->active()
            ->with(['level:id,name', 'schoolClass:id,name'])
            ->orderBy('name_en')
            ->get(['id', 'level_id', 'school_class_id', 'name_kh', 'name_en'])
            ->map(fn (Student $student): array => [
                'id' => $student->id,
                'routeKey' => $student->routeKey(),
                'nameKh' => $student->name_kh,
                'nameEn' => $student->name_en,
                'level' => $student->level?->name ?? '',
                'className' => $student->schoolClass?->name ?? '',
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function resultPayload(ExamResult $examResult): array
    {
        $score = $examResult->score === null ? null : (float) $examResult->score;
        $maxScore = (float) $examResult->max_score;

        return [
            'id' => $examResult->id,
            'routeKey' => $examResult->routeKey(),
            'examId' => $examResult->exam_id,
            'examTitle' => $examResult->exam?->title ?? 'Unknown exam',
            'examSubject' => $examResult->exam?->subject ?? '',
            'examDate' => $examResult->exam?->exam_date?->format('Y-m-d') ?? '',
            'studentId' => $examResult->student_id,
            'studentNameKh' => $examResult->student?->name_kh ?? '',
            'studentNameEn' => $examResult->student?->name_en ?? 'Unknown student',
            'level' => $examResult->student?->level?->name ?? '',
            'className' => $examResult->student?->schoolClass?->name ?? '',
            'score' => $score,
            'maxScore' => $maxScore,
            'percent' => $score === null ? 0 : round(($score / max($maxScore, 1)) * 100, 2),
            'status' => $examResult->status,
            'note' => $examResult->note ?? '',
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizedData(array $data): array
    {
        $score = $data['score'] ?? null;
        $maxScore = (float) $data['max_score'];

        return [
            'exam_id' => $data['exam_id'],
            'student_id' => $data['student_id'],
            'score' => $score === null || $score === '' ? null : $score,
            'max_score' => $maxScore,
            'status' => $data['status'],
            'note' => $data['note'] ?? null,
        ];
    }
}
