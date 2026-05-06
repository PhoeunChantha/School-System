<?php

namespace Tests\Feature;

use App\Models\GradePeriod;
use App\Models\GradeRecord;
use App\Models\Level;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GradeModelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_grade_record_links_period_student_class_and_grader(): void
    {
        $level = Level::factory()->create();
        $teacher = Teacher::factory()->create();
        $schoolClass = SchoolClass::factory()->for($level)->for($teacher)->create();
        $student = Student::factory()->for($level)->for($schoolClass)->create();
        $period = GradePeriod::factory()->create(['is_current' => true]);
        $grader = User::factory()->create();

        $record = GradeRecord::factory()
            ->for($period)
            ->for($student)
            ->for($schoolClass)
            ->create([
                'speaking' => 90,
                'listening' => 80,
                'reading' => 70,
                'writing' => 60,
                'average' => 75,
                'graded_by' => $grader->id,
            ]);

        $this->assertTrue($record->gradePeriod->is($period));
        $this->assertTrue($record->student->is($student));
        $this->assertTrue($record->schoolClass->is($schoolClass));
        $this->assertTrue($record->grader->is($grader));
        $this->assertTrue($period->gradeRecords->first()->is($record));
        $this->assertTrue($student->gradeRecords->first()->is($record));
        $this->assertTrue($schoolClass->gradeRecords->first()->is($record));
        $this->assertSame('75.00', $record->average);
        $this->assertSame(1, GradePeriod::current()->count());
    }
}
