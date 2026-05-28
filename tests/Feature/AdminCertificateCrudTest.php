<?php

namespace Tests\Feature;

use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\Level;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class AdminCertificateCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_certificates_page(): void
    {
        $this->actingAs(User::factory()->create());

        $level = Level::factory()->create(['name' => 'Intermediate 1']);
        $student = Student::factory()->for($level)->create(['name_en' => 'Sokh Dara']);
        $template = CertificateTemplate::factory()->create(['name' => 'Default Completion']);
        Certificate::factory()->for($student)->for($level)->for($template, 'template')->create(['title' => 'Course Completion']);

        $this->get(route('admin.certs'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/certs/index')
                ->has('certificates', 1)
                ->has('templates', 1)
                ->where('certificates.0.studentNameEn', 'Sokh Dara')
                ->where('certificates.0.title', 'Course Completion')
                ->where('certificates.0.levelName', 'Intermediate 1')
                ->where('certificates.0.template.name', 'Default Completion'));
    }

    public function test_admin_can_create_certificate(): void
    {
        $user = User::factory()->create();
        $level = Level::factory()->create();
        $student = Student::factory()->for($level)->create();
        $template = CertificateTemplate::factory()->create();

        $this->actingAs($user)
            ->post(route('admin.certs.store'), $this->validPayload($student->id, $level->id, $template->id))
            ->assertRedirect(route('admin.certs'));

        $this->assertDatabaseHas('certificates', [
            'student_id' => $student->id,
            'level_id' => $level->id,
            'template_id' => $template->id,
            'title' => 'Course Completion',
            'certificate_number' => 'CERT-2026-0001',
            'issued_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_create_certificate_template(): void
    {
        $user = User::factory()->create();
        $payload = [
            'name' => 'Completion Template',
            'template_image' => UploadedFile::fake()->image('certificate-template.png', 1200, 850),
            'logo_image' => UploadedFile::fake()->image('school-logo.png', 300, 300),
            'is_active' => true,
            'layout' => [
                'heading' => 'Certificate',
                'presented_to' => 'This certificate is presented to',
                'body' => 'For completing Pre-Intermediate course.',
                'grade' => 'Grade A+',
                'teacher_signature' => 'Teacher Signature',
                'director_signature' => 'School Director',
                'director_name' => 'Mr. Pov Pisa',
            ],
        ];

        $this->actingAs($user)
            ->post(route('admin.certs.templates.store'), $payload)
            ->assertRedirect(route('admin.certs'));

        $template = CertificateTemplate::query()->where('name', 'Completion Template')->firstOrFail();

        $this->assertStringStartsWith('uploads/certificates/templates/', $template->template_image_path);
        $this->assertStringStartsWith('uploads/certificates/templates/', $template->logo_image_path);
        $this->assertSame('Grade A+', $template->layout['grade']);
        $this->assertSame($user->id, $template->created_by);
        $this->assertFileExists(public_path($template->template_image_path));
        $this->assertFileExists(public_path($template->logo_image_path));
    }

    public function test_admin_can_view_create_certificate_template_page(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get(route('admin.certs.templates.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/certs/templates/create'));
    }

    public function test_admin_can_update_certificate(): void
    {
        $user = User::factory()->create();
        $template = CertificateTemplate::factory()->create();
        $certificate = Certificate::factory()->create([
            'title' => 'Course Completion',
            'status' => 'draft',
            'template_id' => $template->id,
        ]);

        $payload = $this->validPayload($certificate->student_id, $certificate->level_id, $template->id);
        $payload['title'] = 'Academic Excellence';
        $payload['type'] = 'excellence';
        $payload['status'] = 'issued';
        $payload['certificate_number'] = $certificate->certificate_number;

        $this->actingAs($user)
            ->put(route('admin.certs.update', $certificate), $payload)
            ->assertRedirect(route('admin.certs'));

        $this->assertDatabaseHas('certificates', [
            'id' => $certificate->id,
            'title' => 'Academic Excellence',
            'type' => 'excellence',
            'status' => 'issued',
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_delete_certificate(): void
    {
        $this->actingAs(User::factory()->create());

        $certificate = Certificate::factory()->for(CertificateTemplate::factory(), 'template')->create();

        $this->delete(route('admin.certs.destroy', $certificate))
            ->assertRedirect(route('admin.certs'));

        $this->assertDatabaseMissing('certificates', [
            'id' => $certificate->id,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(int $studentId, ?int $levelId, ?int $templateId = null): array
    {
        return [
            'student_id' => $studentId,
            'level_id' => $levelId,
            'template_id' => $templateId,
            'type' => 'completion',
            'title' => 'Course Completion',
            'academic_year' => '2026',
            'issued_on' => '2026-05-20',
            'certificate_number' => 'CERT-2026-0001',
            'status' => 'issued',
        ];
    }
}
