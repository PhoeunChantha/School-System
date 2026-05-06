<?php

namespace Tests\Feature;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Level;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceModelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_attendance_session_belongs_to_class_and_marker(): void
    {
        $level = Level::factory()->create();
        $teacher = Teacher::factory()->create();
        $schoolClass = SchoolClass::factory()->for($level)->for($teacher)->create();
        $marker = User::factory()->create();

        $session = AttendanceSession::factory()
            ->for($schoolClass)
            ->create(['marked_by' => $marker->id]);

        $this->assertTrue($session->schoolClass->is($schoolClass));
        $this->assertTrue($session->marker->is($marker));
        $this->assertTrue($schoolClass->attendanceSessions->first()->is($session));
        $this->assertNotNull($session->attendance_date);
        $this->assertNotNull($session->marked_at);
    }

    public function test_attendance_record_belongs_to_session_and_student(): void
    {
        $level = Level::factory()->create();
        $teacher = Teacher::factory()->create();
        $schoolClass = SchoolClass::factory()->for($level)->for($teacher)->create();
        $student = Student::factory()->for($level)->for($schoolClass)->create();
        $session = AttendanceSession::factory()->for($schoolClass)->create();

        $record = AttendanceRecord::factory()
            ->for($session)
            ->for($student)
            ->create(['status' => 'late']);

        $this->assertTrue($record->attendanceSession->is($session));
        $this->assertTrue($record->student->is($student));
        $this->assertTrue($session->records->first()->is($record));
        $this->assertTrue($student->attendanceRecords->first()->is($record));
        $this->assertSame(1, AttendanceRecord::status('late')->count());
    }
}
