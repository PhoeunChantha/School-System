<?php

namespace Tests\Feature;

use App\Models\HomeworkAssignment;
use App\Models\HomeworkSubmission;
use App\Models\Level;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HomeworkModelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_homework_assignment_belongs_to_class_and_assigner(): void
    {
        $level = Level::factory()->create();
        $teacher = Teacher::factory()->create();
        $schoolClass = SchoolClass::factory()->for($level)->for($teacher)->create();
        $assigner = User::factory()->create();

        $assignment = HomeworkAssignment::factory()
            ->for($schoolClass)
            ->create([
                'assigned_by' => $assigner->id,
                'points' => 80,
            ]);

        $this->assertTrue($assignment->schoolClass->is($schoolClass));
        $this->assertTrue($assignment->assigner->is($assigner));
        $this->assertTrue($schoolClass->homeworkAssignments->first()->is($assignment));
        $this->assertSame(80, $assignment->points);
        $this->assertSame(1, HomeworkAssignment::assigned()->count());
    }

    public function test_homework_submission_links_assignment_and_student(): void
    {
        $level = Level::factory()->create();
        $teacher = Teacher::factory()->create();
        $schoolClass = SchoolClass::factory()->for($level)->for($teacher)->create();
        $student = Student::factory()->for($level)->for($schoolClass)->create();
        $assignment = HomeworkAssignment::factory()->for($schoolClass)->create();

        $submission = HomeworkSubmission::factory()
            ->for($assignment)
            ->for($student)
            ->create([
                'status' => 'graded',
                'score' => 92,
            ]);

        $this->assertTrue($submission->homeworkAssignment->is($assignment));
        $this->assertTrue($submission->student->is($student));
        $this->assertTrue($assignment->submissions->first()->is($submission));
        $this->assertTrue($student->homeworkSubmissions->first()->is($submission));
        $this->assertSame(92, $submission->score);
        $this->assertSame(1, HomeworkSubmission::status('graded')->count());
    }
}
