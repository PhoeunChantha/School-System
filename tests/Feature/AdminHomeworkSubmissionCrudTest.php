<?php

namespace Tests\Feature;

use App\Models\HomeworkAssignment;
use App\Models\HomeworkSubmission;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
        $student = Student::factory()->create(['name_en' => 'Sokh Dara']);
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
                ->where('submissions.0.score', 90));
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
