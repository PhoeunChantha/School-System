<?php

namespace App\Services\Backends;

use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\Level;
use App\Models\Student;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CertificateService
{
    /**
     * @return array{certificates: mixed, templates: mixed, students: mixed, levels: mixed, summary: array<string, mixed>}
     */
    public function indexData(): array
    {
        $certificates = Certificate::query()
            ->with([
                'student:id,name_kh,name_en,level_id,school_class_id',
                'student.level:id,name',
                'student.schoolClass:id,name',
                'level:id,name',
                'template:id,name,template_image_path,logo_image_path,layout,is_active',
            ])
            ->latest('issued_on')
            ->latest('id')
            ->get()
            ->map(fn (Certificate $certificate): array => $this->certificatePayload($certificate));

        return [
            'certificates' => $certificates,
            'templates' => $this->templateOptions(),
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
     * @return array{templates: mixed, students: mixed, levels: mixed}
     */
    public function formData(): array
    {
        return [
            'templates' => $this->templateOptions(),
            'students' => $this->studentOptions(),
            'levels' => $this->levelOptions(),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): Certificate
    {
        return DB::transaction(fn (): Certificate => Certificate::create([
            ...$this->normalizedData($data),
            'certificate_file_path' => $this->storeCertificateFile($data['certificate_file'] ?? null),
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
            $certificateFilePath = $certificate->certificate_file_path;

            if (($data['certificate_file'] ?? null) instanceof UploadedFile) {
                $this->deleteCertificateFile($certificate->certificate_file_path);
                $certificateFilePath = $this->storeCertificateFile($data['certificate_file']);
            }

            $certificate->update([
                ...$this->normalizedData($data),
                'certificate_file_path' => $certificateFilePath,
                'updated_by' => $userId,
            ]);

            return $certificate->refresh();
        });
    }

    public function delete(Certificate $certificate): void
    {
        DB::transaction(function () use ($certificate): void {
            $this->deleteCertificateFile($certificate->certificate_file_path);
            $certificate->delete();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createTemplate(array $data, ?int $userId): CertificateTemplate
    {
        return DB::transaction(fn (): CertificateTemplate => CertificateTemplate::create([
            ...$this->normalizedTemplateData($data),
            'template_image_path' => $this->storeTemplateImage($data['template_image'] ?? null),
            'logo_image_path' => $this->storeTemplateImage($data['logo_image'] ?? null),
            'created_by' => $userId,
            'updated_by' => $userId,
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateTemplate(CertificateTemplate $template, array $data, ?int $userId): CertificateTemplate
    {
        return DB::transaction(function () use ($template, $data, $userId): CertificateTemplate {
            $templateImagePath = $template->template_image_path;
            $logoImagePath = $template->logo_image_path;

            if (($data['template_image'] ?? null) instanceof UploadedFile) {
                $this->deleteTemplateImage($template->template_image_path);
                $templateImagePath = $this->storeTemplateImage($data['template_image']);
            }

            if (($data['logo_image'] ?? null) instanceof UploadedFile) {
                $this->deleteTemplateImage($template->logo_image_path);
                $logoImagePath = $this->storeTemplateImage($data['logo_image']);
            }

            $template->update([
                ...$this->normalizedTemplateData($data),
                'template_image_path' => $templateImagePath,
                'logo_image_path' => $logoImagePath,
                'updated_by' => $userId,
            ]);

            return $template->refresh();
        });
    }

    public function deleteTemplate(CertificateTemplate $template): void
    {
        DB::transaction(function () use ($template): void {
            $this->deleteTemplateImage($template->template_image_path);
            $this->deleteTemplateImage($template->logo_image_path);
            $template->delete();
        });
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
                'routeKey' => $level->routeKey(),
                'name' => $level->name,
            ]);
    }

    /**
     * @return mixed
     */
    private function templateOptions()
    {
        return CertificateTemplate::query()
            ->withCount('certificates')
            ->latest('id')
            ->get()
            ->map(fn (CertificateTemplate $template): array => $this->templatePayload($template));
    }

    /**
     * @return array<string, mixed>
     */
    private function certificatePayload(Certificate $certificate): array
    {
        return [
            'id' => $certificate->id,
            'routeKey' => $certificate->routeKey(),
            'studentId' => $certificate->student_id,
            'templateId' => $certificate->template_id,
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
            'certificateFileUrl' => $certificate->certificate_file_path ? asset($certificate->certificate_file_path) : '',
            'template' => $certificate->template ? $this->templatePayload($certificate->template) : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function templatePayload(CertificateTemplate $template): array
    {
        return [
            'id' => $template->id,
            'routeKey' => $template->routeKey(),
            'name' => $template->name,
            'templateImageUrl' => asset($template->template_image_path),
            'logoImageUrl' => $template->logo_image_path ? asset($template->logo_image_path) : '',
            'layout' => $this->normalizeLayout($template->layout ?? []),
            'isActive' => $template->is_active,
            'certificatesCount' => $template->certificates_count ?? 0,
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
            'template_id' => $data['template_id'] ?? null,
            'type' => $data['type'],
            'title' => $data['title'],
            'academic_year' => $data['academic_year'] ?? null,
            'issued_on' => $data['issued_on'],
            'certificate_number' => $data['certificate_number'],
            'status' => $data['status'],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizedTemplateData(array $data): array
    {
        return [
            'name' => $data['name'],
            'layout' => $this->normalizeLayout($data['layout'] ?? []),
            'is_active' => (bool) ($data['is_active'] ?? true),
        ];
    }

    private function storeTemplateImage(mixed $file): ?string
    {
        if (! $file instanceof UploadedFile) {
            return null;
        }

        $destination = public_path('uploads/certificates/templates');

        if (! is_dir($destination)) {
            mkdir($destination, 0755, true);
        }

        $filename = Str::uuid().'.'.$file->extension();
        $file->move($destination, $filename);

        return 'uploads/certificates/templates/'.$filename;
    }

    private function storeCertificateFile(mixed $file): ?string
    {
        if (! $file instanceof UploadedFile) {
            return null;
        }

        $destination = public_path('uploads/certificates/files');

        if (! is_dir($destination)) {
            mkdir($destination, 0755, true);
        }

        $filename = Str::uuid().'.'.$file->extension();
        $file->move($destination, $filename);

        return 'uploads/certificates/files/'.$filename;
    }

    private function deleteTemplateImage(?string $path): void
    {
        if ($path && file_exists(public_path($path))) {
            unlink(public_path($path));
        }
    }

    private function deleteCertificateFile(?string $path): void
    {
        if ($path && file_exists(public_path($path))) {
            unlink(public_path($path));
        }
    }

    /**
     * @return array<string, string>
     */
    private function normalizeLayout(mixed $layout): array
    {
        $layout = is_array($layout) ? $layout : [];

        return [
            'heading' => (string) ($layout['heading'] ?? 'Certificate'),
            'presented_to' => (string) ($layout['presented_to'] ?? 'This certificate is presented to'),
            'body' => (string) ($layout['body'] ?? 'For completing the course with dedication and strong progress.'),
            'grade' => (string) ($layout['grade'] ?? 'Grade A+'),
            'teacher_signature' => (string) ($layout['teacher_signature'] ?? 'Teacher Signature'),
            'director_signature' => (string) ($layout['director_signature'] ?? 'School Director'),
            'director_name' => (string) ($layout['director_name'] ?? ''),
        ];
    }
}
