<?php

namespace Tests\Feature\Backends;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\FeeCharge;
use App\Models\GradeRecord;
use App\Models\Payment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\Backends\ReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_builds_reports_from_database_records(): void
    {
        $schoolClass = SchoolClass::factory()->create(['name' => 'Beginner 1']);
        $student = Student::factory()->create([
            'school_class_id' => $schoolClass->id,
            'level_id' => $schoolClass->level_id,
            'name_en' => 'Test Student',
            'fee_status' => 'paid',
            'monthly_fee' => 25,
        ]);

        $attendanceSession = AttendanceSession::factory()->create([
            'school_class_id' => $schoolClass->id,
        ]);

        AttendanceRecord::factory()->create([
            'attendance_session_id' => $attendanceSession->id,
            'student_id' => $student->id,
            'status' => 'present',
        ]);

        $secondAttendanceSession = AttendanceSession::factory()->create([
            'school_class_id' => $schoolClass->id,
        ]);

        AttendanceRecord::factory()->create([
            'attendance_session_id' => $secondAttendanceSession->id,
            'student_id' => $student->id,
            'status' => 'absent',
        ]);

        GradeRecord::factory()->create([
            'student_id' => $student->id,
            'school_class_id' => $schoolClass->id,
            'speaking' => 80,
            'listening' => 70,
            'reading' => 90,
            'writing' => 60,
            'average' => 75,
        ]);

        $feeCharge = FeeCharge::factory()->create([
            'student_id' => $student->id,
            'level_id' => $student->level_id,
            'amount' => 25,
            'status' => 'paid',
        ]);

        Payment::factory()->create([
            'fee_charge_id' => $feeCharge->id,
            'student_id' => $student->id,
            'amount' => 25,
            'status' => 'paid',
        ]);

        $data = app(ReportService::class)->indexData();

        $this->assertSame(1, $data['summary']['totalStudents']);
        $this->assertSame(50, $data['summary']['avgAttendance']);
        $this->assertSame(75, $data['summary']['avgGrade']);
        $this->assertEquals(25.0, $data['summary']['feesCollected']);
        $this->assertSame('Beginner 1', $data['attendance']['classes']->first()['name']);
        $this->assertSame('Test Student', $data['grades']['students']->first()['nameEn']);
        $this->assertSame('paid', $data['fees']['students']->first()['status']);
    }
}
