<?php

namespace Tests\Feature;

use App\Models\GradePeriod;
use App\Models\GradeRecord;
use App\Models\HomeworkAssignment;
use App\Models\HomeworkSubmission;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherGradeManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_open_teacher_grade_management_page(): void
    {
        $this->actingAs(User::factory()->create());

        $teacher = Teacher::factory()->create(['name_en' => 'Teacher Dara']);
        $schoolClass = SchoolClass::factory()->for($teacher)->create(['name' => 'Advanced A']);
        $period = GradePeriod::factory()->create(['name' => 'May 2026', 'is_current' => true]);
        $student = Student::factory()->for($schoolClass)->create(['name_en' => 'Sok Dara']);
        $homeworkAssignment = HomeworkAssignment::factory()->for($schoolClass)->create(['points' => 20]);

        GradeRecord::factory()->for($period)->for($student)->create([
            'school_class_id' => $schoolClass->id,
            'speaking' => 80,
            'listening' => 70,
            'reading' => 90,
            'writing' => 60,
            'average' => 75,
        ]);
        HomeworkSubmission::factory()->for($homeworkAssignment)->for($student)->create([
            'score' => 18,
            'status' => 'graded',
        ]);

        $this->get(route('admin.teachers.grades', $teacher))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/teachers/grades')
                ->where('teacher.nameEn', 'Teacher Dara')
                ->where('students.0.nameEn', 'Sok Dara')
                ->where('students.0.homework.average', 90)
                ->where('students.0.homework.earned', 18)
                ->where('students.0.homework.points', 20)
                ->where('students.0.homework.count', 1)
                ->where('records.0.average', 75));
    }

    public function test_admin_can_save_score_for_teacher_student(): void
    {
        $user = User::factory()->create();
        $teacher = Teacher::factory()->create();
        $schoolClass = SchoolClass::factory()->for($teacher)->create();
        $period = GradePeriod::factory()->create(['is_current' => true]);
        $student = Student::factory()->for($schoolClass)->create();

        $response = $this->actingAs($user)
            ->post(route('admin.teachers.grades.store', $teacher), [
                'grade_period_id' => $period->id,
                'student_id' => $student->id,
                'school_class_id' => $schoolClass->id,
                'speaking' => 90,
                'listening' => 80,
                'reading' => 70,
                'writing' => 60,
            ])
            ->assertRedirect();

        $this->assertMatchesRegularExpression(
            '#/admin/teachers/.+/grades$#',
            $response->headers->get('Location') ?? '',
        );

        $this->assertDatabaseHas('grade_records', [
            'grade_period_id' => $period->id,
            'student_id' => $student->id,
            'school_class_id' => $schoolClass->id,
            'speaking' => 90,
            'listening' => 80,
            'reading' => 70,
            'writing' => 60,
            'average' => 75,
            'graded_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_cannot_save_score_for_student_from_another_teacher(): void
    {
        $this->actingAs(User::factory()->create());

        $teacher = Teacher::factory()->create();
        $otherClass = SchoolClass::factory()->create();
        $period = GradePeriod::factory()->create(['is_current' => true]);
        $student = Student::factory()->for($otherClass)->create();

        $this->post(route('admin.teachers.grades.store', $teacher), [
            'grade_period_id' => $period->id,
            'student_id' => $student->id,
            'school_class_id' => $otherClass->id,
            'speaking' => 90,
            'listening' => 80,
            'reading' => 70,
            'writing' => 60,
        ])
            ->assertSessionHasErrors('student_id');

        $this->assertDatabaseMissing('grade_records', [
            'grade_period_id' => $period->id,
            'student_id' => $student->id,
        ]);
    }
}
