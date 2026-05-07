<?php

namespace App\Services\Backends;

use App\Models\Certificate;
use App\Models\Level;
use App\Models\Student;
use Illuminate\Support\Facades\DB;

class CertificateService
{
    /**
     * @return array{certificates: mixed, students: mixed, levels: mixed, summary: array<string, mixed>}
     */
    public function indexData(): array
    {
        $certificates = Certificate::query()
            ->with([
                'student:id,name_kh,name_en,level_id,school_class_id',
                'student.level:id,name',
                'student.schoolClass:id,name',
                'level:id,name',
            ])
            ->latest('issued_on')
            ->latest('id')
            ->get()
            ->map(fn (Certificate $certificate): array => $this->certificatePayload($certificate));

        return [
            'certificates' => $certificates,
            'students' => $this->studentOptions(),
            'levels' => $this->levelOptions(),
            'summary' => [
                'certificateCount' => $certificates->count(),
                'issuedCount' => $certificates->where('status', 'issued')->count(),
                'draftCount' => $certificates->where('status', 'draft')->count(),
                'voidCount' => $certificates->where('status', 'void')->count(),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): Certificate
    {
        return DB::transaction(fn (): Certificate => Certificate::create([
            ...$this->normalizedData($data),
            'issued_by' => $userId,
            'updated_by' => $userId,
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Certificate $certificate, array $data, ?int $userId): Certificate
    {
        return DB::transaction(function () use ($certificate, $data, $userId): Certificate {
            $certificate->update([
                ...$this->normalizedData($data),
                'updated_by' => $userId,
            ]);

            return $certificate->refresh();
        });
    }

    public function delete(Certificate $certificate): void
    {
        DB::transaction(fn (): ?bool => $certificate->delete());
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
                'nameKh' => $student->name_kh,
                'nameEn' => $student->name_en,
                'levelId' => $student->level_id,
                'level' => $student->level?->name ?? '',
                'className' => $student->schoolClass?->name ?? '',
            ]);
    }

    /**
     * @return mixed
     */
    private function levelOptions()
    {
        return Level::query()
            ->active()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Level $level): array => [
                'id' => $level->id,
                'name' => $level->name,
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function certificatePayload(Certificate $certificate): array
    {
        return [
            'id' => $certificate->id,
            'studentId' => $certificate->student_id,
            'studentNameKh' => $certificate->student?->name_kh ?? '',
            'studentNameEn' => $certificate->student?->name_en ?? 'Unknown student',
            'className' => $certificate->student?->schoolClass?->name ?? '',
            'levelId' => $certificate->level_id,
            'levelName' => $certificate->level?->name ?? $certificate->student?->level?->name ?? '',
            'type' => $certificate->type,
            'title' => $certificate->title,
            'academicYear' => $certificate->academic_year ?? '',
            'issuedOn' => $certificate->issued_on?->format('Y-m-d') ?? '',
            'certificateNumber' => $certificate->certificate_number,
            'status' => $certificate->status,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizedData(array $data): array
    {
        $student = Student::query()->find($data['student_id']);

        return [
            'student_id' => $data['student_id'],
            'level_id' => $data['level_id'] ?? $student?->level_id,
            'type' => $data['type'],
            'title' => $data['title'],
            'academic_year' => $data['academic_year'] ?? null,
            'issued_on' => $data['issued_on'],
            'certificate_number' => $data['certificate_number'],
            'status' => $data['status'],
        ];
    }
}
