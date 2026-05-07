<?php

namespace Tests\Feature;

use App\Models\GradePeriod;
use App\Models\GradeRecord;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminGradeRecordCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_grades_page(): void
    {
        $this->actingAs(User::factory()->create());

        $period = GradePeriod::factory()->create(['name' => 'May 2026', 'is_current' => true]);
        $student = Student::factory()->create(['name_en' => 'Sokh Dara']);
        GradeRecord::factory()->for($period)->for($student)->create([
            'speaking' => 80,
            'listening' => 70,
            'reading' => 90,
            'writing' => 60,
            'average' => 75,
        ]);

        $this->get(route('admin.grades'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/grades/index')
                ->has('records', 1)
                ->where('records.0.studentNameEn', 'Sokh Dara')
                ->where('records.0.average', 75));
    }

    public function test_admin_can_create_grade_record(): void
    {
        $user = User::factory()->create();
        $period = GradePeriod::factory()->create(['is_current' => true]);
        $student = Student::factory()->create();

        $this->actingAs($user)
            ->post(route('admin.grades.store'), $this->validPayload($period->id, $student->id, $student->school_class_id))
            ->assertRedirect(route('admin.grades'));

        $this->assertDatabaseHas('grade_records', [
            'grade_period_id' => $period->id,
            'student_id' => $student->id,
            'speaking' => 80,
            'listening' => 70,
            'reading' => 90,
            'writing' => 60,
            'average' => 75,
            'graded_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_update_grade_record(): void
    {
        $user = User::factory()->create();
        $gradeRecord = GradeRecord::factory()->create([
            'speaking' => 50,
            'listening' => 50,
            'reading' => 50,
            'writing' => 50,
            'average' => 50,
        ]);

        $payload = $this->validPayload($gradeRecord->grade_period_id, $gradeRecord->student_id, $gradeRecord->school_class_id);
        $payload['speaking'] = 100;
        $payload['listening'] = 90;
        $payload['reading'] = 80;
        $payload['writing'] = 70;

        $this->actingAs($user)
            ->put(route('admin.grades.update', $gradeRecord), $payload)
            ->assertRedirect(route('admin.grades'));

        $this->assertDatabaseHas('grade_records', [
            'id' => $gradeRecord->id,
            'speaking' => 100,
            'listening' => 90,
            'reading' => 80,
            'writing' => 70,
            'average' => 85,
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_delete_grade_record(): void
    {
        $this->actingAs(User::factory()->create());

        $gradeRecord = GradeRecord::factory()->create();

        $this->delete(route('admin.grades.destroy', $gradeRecord))
            ->assertRedirect(route('admin.grades'));

        $this->assertDatabaseMissing('grade_records', [
            'id' => $gradeRecord->id,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(int $periodId, int $studentId, ?int $schoolClassId): array
    {
        return [
            'grade_period_id' => $periodId,
            'student_id' => $studentId,
            'school_class_id' => $schoolClassId,
            'speaking' => 80,
            'listening' => 70,
            'reading' => 90,
            'writing' => 60,
        ];
    }
}
