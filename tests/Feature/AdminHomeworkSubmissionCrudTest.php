<?php

namespace Tests\Feature;

use App\Events\HomeworkSubmissionSubmitted;
use App\Models\HomeworkAssignment;
use App\Models\HomeworkSubmission;
use App\Models\HomeworkSubmissionRead;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class AdminHomeworkSubmissionCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_homework_submissions_page(): void
    {
        $this->withoutVite();

        $this->actingAs(User::factory()->create());

        $assignment = HomeworkAssignment::factory()->create([
            'title_en' => 'Write about family',
            'points' => 100,
        ]);
        $student = Student::factory()->create([
            'name_en' => 'Sokh Dara',
            'profile_photo' => 'uploads/students/sokh-dara.jpg',
        ]);
        HomeworkSubmission::factory()->for($assignment)->for($student)->create([
            'score' => 90,
            'status' => 'graded',
        ]);

        $this->get(route('admin.homework-submissions'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/homework-submissions/index')
                ->has('submissions', 1)
                ->where('submissions.0.assignmentTitleEn', 'Write about family')
                ->where('submissions.0.studentNameEn', 'Sokh Dara')
                ->where('submissions.0.studentPhoto', asset('uploads/students/sokh-dara.jpg'))
                ->where('submissions.0.score', 90));
    }

    public function test_admin_can_view_student_homework_submit_page(): void
    {
        $this->actingAs(User::factory()->create());

        HomeworkAssignment::factory()->create(['title_en' => 'Writing Practice']);
        Student::factory()->create(['name_en' => 'Sokh Dara']);

        $this->get(route('admin.homework-submissions.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/homework-submissions/create')
                ->has('assignments', 1)
                ->has('students', 1)
                ->where('assignments.0.titleEn', 'Writing Practice')
                ->where('students.0.nameEn', 'Sokh Dara'));
    }

    public function test_admin_can_create_homework_submission(): void
    {
        $user = User::factory()->create();
        $assignment = HomeworkAssignment::factory()->create();
        $student = Student::factory()->create();

        $this->actingAs($user)
            ->post(route('admin.homework-submissions.store'), $this->validPayload($assignment->id, $student->id))
            ->assertRedirect(route('admin.homework-submissions'));

        $this->assertDatabaseHas('homework_submissions', [
            'homework_assignment_id' => $assignment->id,
            'student_id' => $student->id,
            'score' => 95,
            'status' => 'graded',
            'feedback' => 'Well done.',
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    public function test_student_homework_submit_flow_can_upload_file(): void
    {
        $user = User::factory()->create();
        $assignment = HomeworkAssignment::factory()->create();
        $student = Student::factory()->create();
        $payload = $this->validPayload($assignment->id, $student->id);
        $payload['score'] = null;
        $payload['status'] = 'submitted';
        $payload['feedback'] = 'Please check my homework.';
        $payload['attachment_file'] = UploadedFile::fake()->create('completed-homework.pdf', 128, 'application/pdf');

        $this->actingAs($user)
            ->post(route('admin.homework-submissions.store'), $payload)
            ->assertRedirect(route('admin.homework-submissions'));

        $submission = HomeworkSubmission::query()
            ->where('homework_assignment_id', $assignment->id)
            ->where('student_id', $student->id)
            ->firstOrFail();

        $this->assertSame('submitted', $submission->status);
        $this->assertSame('completed-homework.pdf', $submission->attachment_name);
        $this->assertNotNull($submission->attachment_path);
        $this->assertStringStartsWith('uploads/homework-submissions/', $submission->attachment_path);
        $this->assertFileExists(public_path($submission->attachment_path));

        unlink(public_path($submission->attachment_path));
    }

    public function test_admin_can_update_homework_submission(): void
    {
        $user = User::factory()->create();
        $homeworkSubmission = HomeworkSubmission::factory()->create([
            'score' => 55,
            'status' => 'submitted',
            'feedback' => 'Received.',
        ]);

        $payload = $this->validPayload($homeworkSubmission->homework_assignment_id, $homeworkSubmission->student_id);
        $payload['score'] = 72;
        $payload['status'] = 'graded';
        $payload['feedback'] = 'Improved work.';

        $this->actingAs($user)
            ->put(route('admin.homework-submissions.update', $homeworkSubmission), $payload)
            ->assertRedirect(route('admin.homework-submissions'));

        $this->assertDatabaseHas('homework_submissions', [
            'id' => $homeworkSubmission->id,
            'score' => 72,
            'status' => 'graded',
            'feedback' => 'Improved work.',
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_delete_homework_submission(): void
    {
        $this->actingAs(User::factory()->create());

        $homeworkSubmission = HomeworkSubmission::factory()->create();

        $this->delete(route('admin.homework-submissions.destroy', $homeworkSubmission))
            ->assertRedirect(route('admin.homework-submissions'));

        $this->assertDatabaseMissing('homework_submissions', [
            'id' => $homeworkSubmission->id,
        ]);
    }

    public function test_student_homework_submission_broadcasts_admin_alert_and_resets_reads(): void
    {
        Event::fake([HomeworkSubmissionSubmitted::class]);

        $studentUser = User::factory()->create();
        $adminUser = User::factory()->create();
        $assignment = HomeworkAssignment::factory()->create();
        $student = Student::factory()->create([
            'user_id' => $studentUser->id,
            'school_class_id' => $assignment->school_class_id,
        ]);
        $submission = HomeworkSubmission::factory()
            ->for($assignment)
            ->for($student)
            ->create([
                'status' => 'submitted',
                'submitted_at' => now()->subDay(),
            ]);
        HomeworkSubmissionRead::query()->create([
            'homework_submission_id' => $submission->id,
            'user_id' => $adminUser->id,
            'read_at' => now()->subHour(),
        ]);

        $this->actingAs($studentUser)
            ->post(route('student.homework.submit', $assignment), [
                'note' => 'Please review my new homework.',
            ])
            ->assertRedirect();

        $submission->refresh();

        $this->assertSame('Please review my new homework.', $submission->note);
        $this->assertDatabaseMissing('homework_submission_reads', [
            'homework_submission_id' => $submission->id,
            'user_id' => $adminUser->id,
        ]);
        Event::assertDispatched(
            HomeworkSubmissionSubmitted::class,
            fn (HomeworkSubmissionSubmitted $event): bool => $event->submission->is($submission),
        );
    }

    public function test_homework_submissions_page_marks_alerts_read_for_current_user(): void
    {
        $user = User::factory()->create();
        $user->givePermissionTo(Permission::findOrCreate('homework-submissions.view'));
        $submission = HomeworkSubmission::factory()->create([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('admin.homework-submissions'))
            ->assertOk();

        $this->assertDatabaseHas('homework_submission_reads', [
            'homework_submission_id' => $submission->id,
            'user_id' => $user->id,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(int $homeworkAssignmentId, int $studentId): array
    {
        return [
            'homework_assignment_id' => $homeworkAssignmentId,
            'student_id' => $studentId,
            'submitted_at' => '2026-05-20 09:30:00',
            'score' => 95,
            'status' => 'graded',
            'feedback' => 'Well done.',
        ];
    }
}
