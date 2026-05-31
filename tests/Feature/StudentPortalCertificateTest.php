<?php

namespace Tests\Feature;

use App\Models\Certificate;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentPortalCertificateTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_view_only_their_issued_certificates(): void
    {
        $user = User::factory()->create();
        $student = Student::factory()->create(['user_id' => $user->id]);
        $otherStudent = Student::factory()->create();

        Certificate::factory()->for($student)->create([
            'title' => 'Course Completion',
            'type' => 'completion',
            'certificate_number' => 'CERT-2026-0001',
            'certificate_file_path' => 'uploads/certificates/files/student-certificate.png',
            'issued_on' => '2026-05-29',
            'status' => 'issued',
        ]);

        Certificate::factory()->for($student)->create([
            'status' => 'draft',
        ]);

        Certificate::factory()->for($otherStudent)->create([
            'title' => 'Other Certificate',
            'status' => 'issued',
        ]);

        $this->actingAs($user)
            ->get(route('student.certificates'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('student/certificates/index')
                ->where('summary.total', 1)
                ->where('certificates.0.title', 'Course Completion')
                ->where('certificates.0.certificateNumber', 'CERT-2026-0001')
                ->where('certificates.0.imageUrl', asset('uploads/certificates/files/student-certificate.png'))
                ->missing('certificates.1'));
    }
}
