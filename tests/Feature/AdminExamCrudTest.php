<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class AdminExamCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_exam_page(): void
    {
        $this->actingAs(User::factory()->create());

        $schoolClass = SchoolClass::factory()->create(['name' => 'Intermediate 1']);
        Exam::factory()->for($schoolClass)->create(['title' => 'Mid Term English Exam']);

        $this->get(route('admin.exam'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/exam/index')
                ->has('exams', 1)
                ->where('exams.0.title', 'Mid Term English Exam')
                ->where('exams.0.className', 'Intermediate 1'));
    }

    public function test_admin_can_create_exam(): void
    {
        $user = User::factory()->create();
        $schoolClass = SchoolClass::factory()->create();

        $this->actingAs($user)
            ->post(route('admin.exam.store'), $this->validPayload($schoolClass->id))
            ->assertRedirect(route('admin.exam'));

        $this->assertDatabaseHas('exams', [
            'school_class_id' => $schoolClass->id,
            'title' => 'Mid Term English Exam',
            'status' => 'draft',
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_create_exam_with_word_attachment(): void
    {
        $this->actingAs(User::factory()->create());
        $schoolClass = SchoolClass::factory()->create();

        $this->post(route('admin.exam.store'), [
            ...$this->validPayload($schoolClass->id),
            'attachment' => UploadedFile::fake()->create(
                'midterm.docx',
                24,
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ),
        ])->assertRedirect(route('admin.exam'));

        $exam = Exam::query()->where('title', 'Mid Term English Exam')->firstOrFail();

        $this->assertNotNull($exam->attachment_path);
        $this->assertStringStartsWith('uploads/exams/', $exam->attachment_path);
        $this->assertFileExists(public_path($exam->attachment_path));

        unlink(public_path($exam->attachment_path));
    }

    public function test_admin_can_create_exam_with_pdf_attachment(): void
    {
        $this->actingAs(User::factory()->create());
        $schoolClass = SchoolClass::factory()->create();

        $this->post(route('admin.exam.store'), [
            ...$this->validPayload($schoolClass->id),
            'attachment' => UploadedFile::fake()->create(
                'midterm.pdf',
                24,
                'application/pdf',
            ),
        ])->assertRedirect(route('admin.exam'));

        $exam = Exam::query()->where('title', 'Mid Term English Exam')->firstOrFail();

        $this->assertNotNull($exam->attachment_path);
        $this->assertStringStartsWith('uploads/exams/', $exam->attachment_path);
        $this->assertStringEndsWith('.pdf', $exam->attachment_path);
        $this->assertFileExists(public_path($exam->attachment_path));

        unlink(public_path($exam->attachment_path));
    }

    public function test_admin_can_update_exam(): void
    {
        $user = User::factory()->create();
        $exam = Exam::factory()->create(['title' => 'Mid Term English Exam']);

        $payload = $this->validPayload($exam->school_class_id);
        $payload['title'] = 'Final English Exam';
        $payload['status'] = 'published';

        $this->actingAs($user)
            ->put(route('admin.exam.update', $exam), $payload)
            ->assertRedirect(route('admin.exam'));

        $this->assertDatabaseHas('exams', [
            'id' => $exam->id,
            'title' => 'Final English Exam',
            'status' => 'published',
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_delete_exam(): void
    {
        $this->actingAs(User::factory()->create());

        $exam = Exam::factory()->create();

        $this->delete(route('admin.exam.destroy', $exam))
            ->assertRedirect(route('admin.exam'));

        $this->assertSoftDeleted('exams', [
            'id' => $exam->id,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(int $schoolClassId): array
    {
        return [
            'school_class_id' => $schoolClassId,
            'title' => 'Mid Term English Exam',
            'subject' => 'English Grammar',
            'academic_year' => '2026',
            'exam_date' => '2026-05-15',
            'duration_minutes' => 90,
            'content' => '<h1>Exam Paper</h1><p>Answer all questions.</p>',
            'status' => 'draft',
        ];
    }
}
