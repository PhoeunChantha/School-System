<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminExamResultCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_exam_results_page(): void
    {
        $this->withoutVite();

        $this->actingAs(User::factory()->create());

        $exam = Exam::factory()->create(['title' => 'Mid Term Exam']);
        $student = Student::factory()->create(['name_en' => 'Sokh Dara']);
        ExamResult::factory()->for($exam)->for($student)->create([
            'score' => 80,
            'max_score' => 100,
            'status' => 'passed',
        ]);

        $this->get(route('admin.exam-results'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/exam-results/index')
                ->has('results', 1)
                ->where('results.0.examTitle', 'Mid Term Exam')
                ->where('results.0.studentNameEn', 'Sokh Dara')
                ->where('results.0.percent', 80));
    }

    public function test_admin_can_create_exam_result(): void
    {
        $user = User::factory()->create();
        $exam = Exam::factory()->create();
        $student = Student::factory()->create();

        $this->actingAs($user)
            ->post(route('admin.exam-results.store'), $this->validPayload($exam->id, $student->id))
            ->assertRedirect(route('admin.exam-results'));

        $this->assertDatabaseHas('exam_results', [
            'exam_id' => $exam->id,
            'student_id' => $student->id,
            'score' => 85,
            'max_score' => 100,
            'status' => 'passed',
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_update_exam_result(): void
    {
        $user = User::factory()->create();
        $examResult = ExamResult::factory()->create([
            'score' => 60,
            'max_score' => 100,
            'status' => 'passed',
        ]);

        $payload = $this->validPayload($examResult->exam_id, $examResult->student_id);
        $payload['score'] = 45;
        $payload['status'] = 'failed';
        $payload['note'] = 'Needs retake.';

        $this->actingAs($user)
            ->put(route('admin.exam-results.update', $examResult), $payload)
            ->assertRedirect(route('admin.exam-results'));

        $this->assertDatabaseHas('exam_results', [
            'id' => $examResult->id,
            'score' => 45,
            'status' => 'failed',
            'note' => 'Needs retake.',
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_delete_exam_result(): void
    {
        $this->actingAs(User::factory()->create());

        $examResult = ExamResult::factory()->create();

        $this->delete(route('admin.exam-results.destroy', $examResult))
            ->assertRedirect(route('admin.exam-results'));

        $this->assertDatabaseMissing('exam_results', [
            'id' => $examResult->id,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(int $examId, int $studentId): array
    {
        return [
            'exam_id' => $examId,
            'student_id' => $studentId,
            'score' => 85,
            'max_score' => 100,
            'status' => 'passed',
            'note' => 'Strong result.',
        ];
    }
}
