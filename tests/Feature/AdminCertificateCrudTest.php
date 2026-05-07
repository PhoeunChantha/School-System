<?php

namespace Tests\Feature;

use App\Models\Certificate;
use App\Models\Level;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCertificateCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_certificates_page(): void
    {
        $this->actingAs(User::factory()->create());

        $level = Level::factory()->create(['name' => 'Intermediate 1']);
        $student = Student::factory()->for($level)->create(['name_en' => 'Sokh Dara']);
        Certificate::factory()->for($student)->for($level)->create(['title' => 'Course Completion']);

        $this->get(route('admin.certs'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/certs/index')
                ->has('certificates', 1)
                ->where('certificates.0.studentNameEn', 'Sokh Dara')
                ->where('certificates.0.title', 'Course Completion')
                ->where('certificates.0.levelName', 'Intermediate 1'));
    }

    public function test_admin_can_create_certificate(): void
    {
        $user = User::factory()->create();
        $level = Level::factory()->create();
        $student = Student::factory()->for($level)->create();

        $this->actingAs($user)
            ->post(route('admin.certs.store'), $this->validPayload($student->id, $level->id))
            ->assertRedirect(route('admin.certs'));

        $this->assertDatabaseHas('certificates', [
            'student_id' => $student->id,
            'level_id' => $level->id,
            'title' => 'Course Completion',
            'certificate_number' => 'CERT-2026-0001',
            'issued_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_update_certificate(): void
    {
        $user = User::factory()->create();
        $certificate = Certificate::factory()->create([
            'title' => 'Course Completion',
            'status' => 'draft',
        ]);

        $payload = $this->validPayload($certificate->student_id, $certificate->level_id);
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

        $certificate = Certificate::factory()->create();

        $this->delete(route('admin.certs.destroy', $certificate))
            ->assertRedirect(route('admin.certs'));

        $this->assertDatabaseMissing('certificates', [
            'id' => $certificate->id,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(int $studentId, ?int $levelId): array
    {
        return [
            'student_id' => $studentId,
            'level_id' => $levelId,
            'type' => 'completion',
            'title' => 'Course Completion',
            'academic_year' => '2026',
            'issued_on' => '2026-05-20',
            'certificate_number' => 'CERT-2026-0001',
            'status' => 'issued',
        ];
    }
}
