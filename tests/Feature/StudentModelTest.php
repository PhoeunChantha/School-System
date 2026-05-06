<?php

namespace Tests\Feature;

use App\Models\Level;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_belongs_to_level_and_school_class(): void
    {
        $level = Level::factory()->create();
        $teacher = Teacher::factory()->create();
        $schoolClass = SchoolClass::factory()->for($level)->for($teacher)->create();

        $student = Student::factory()
            ->for($level)
            ->for($schoolClass)
            ->create([
                'monthly_fee' => 75,
                'scholarship_amount' => 15,
            ]);

        $this->assertTrue($student->level->is($level));
        $this->assertTrue($student->schoolClass->is($schoolClass));
        $this->assertTrue($level->students->first()->is($student));
        $this->assertTrue($schoolClass->students->first()->is($student));
        $this->assertSame('75.00', $student->monthly_fee);
        $this->assertSame('15.00', $student->scholarship_amount);
    }

    public function test_student_scopes_match_dashboard_filters(): void
    {
        Student::factory()->create(['status' => 'active', 'fee_status' => 'unpaid']);
        Student::factory()->create(['status' => 'inactive', 'fee_status' => 'paid']);

        $this->assertSame(1, Student::active()->count());
        $this->assertSame(1, Student::unpaid()->count());
    }

    public function test_student_tracks_creator_and_updater(): void
    {
        $creator = User::factory()->create();
        $updater = User::factory()->create();

        $student = Student::factory()->create([
            'created_by' => $creator->id,
            'updated_by' => $updater->id,
        ]);

        $this->assertTrue($student->creator->is($creator));
        $this->assertTrue($student->updater->is($updater));
    }
}
