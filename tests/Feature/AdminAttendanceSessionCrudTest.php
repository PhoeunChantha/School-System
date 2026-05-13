<?php

namespace Tests\Feature;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAttendanceSessionCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_attendance_page(): void
    {
        $this->actingAs(User::factory()->create());

        $schoolClass = SchoolClass::factory()->create(['name' => 'Beginner 1']);
        $student = Student::factory()->for($schoolClass)->create(['name_en' => 'Sok Dara']);
        $session = AttendanceSession::factory()->for($schoolClass)->create([
            'attendance_date' => '2026-05-07',
            'period' => 'morning',
        ]);
        AttendanceRecord::factory()->for($session)->for($student)->create(['status' => 'present']);

        $this->get(route('admin.attendance'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/attendance/index')
                ->has('sessions', 1)
                ->where('sessions.0.className', 'Beginner 1')
                ->where('sessions.0.presentCount', 1)
                ->has('classes', 1));
    }

    public function test_admin_can_open_attendance_edit_page(): void
    {
        $this->actingAs(User::factory()->create());

        $schoolClass = SchoolClass::factory()->create(['name' => 'Advanced A']);
        $student = Student::factory()->for($schoolClass)->create(['name_en' => 'Chanthy Mao']);
        $session = AttendanceSession::factory()->for($schoolClass)->create([
            'attendance_date' => '2026-05-13',
            'period' => 'morning',
        ]);
        AttendanceRecord::factory()->for($session)->for($student)->create(['status' => 'present']);

        $this->get(route('admin.attendance.edit', $session))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/attendance/mark')
                ->where('editingSession.id', $session->id)
                ->where('editingSession.period', 'morning')
                ->where('editingSession.records.0.status', 'present'));
    }

    public function test_admin_can_open_attendance_edit_page_from_legacy_mark_query(): void
    {
        $this->actingAs(User::factory()->create());

        $schoolClass = SchoolClass::factory()->create(['name' => 'Advanced A']);
        $student = Student::factory()->for($schoolClass)->create(['name_en' => 'Chanthy Mao']);
        $session = AttendanceSession::factory()->for($schoolClass)->create([
            'attendance_date' => '2026-05-13',
            'period' => 'morning',
        ]);
        AttendanceRecord::factory()->for($session)->for($student)->create(['status' => 'late']);

        $this->get(route('admin.attendance.mark', ['edit' => $session->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/attendance/mark')
                ->where('editingSession.id', $session->id)
                ->where('editingSession.period', 'morning')
                ->where('editingSession.records.0.status', 'late'));
    }

    public function test_admin_can_create_attendance_session(): void
    {
        $user = User::factory()->create();
        $schoolClass = SchoolClass::factory()->create();
        $students = Student::factory()->count(2)->for($schoolClass)->create();

        $this->actingAs($user)
            ->post(route('admin.attendance.store'), [
                'school_class_id' => $schoolClass->id,
                'attendance_date' => '2026-05-07',
                'period' => 'morning',
                'records' => [
                    ['student_id' => $students[0]->id, 'status' => 'present', 'note' => null],
                    ['student_id' => $students[1]->id, 'status' => 'absent', 'note' => 'Called parent'],
                ],
            ])
            ->assertRedirect(route('admin.attendance'));

        $this->assertDatabaseHas('attendance_sessions', [
            'school_class_id' => $schoolClass->id,
            'attendance_date' => '2026-05-07',
            'period' => 'morning',
            'marked_by' => $user->id,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $this->assertDatabaseHas('attendance_records', [
            'student_id' => $students[1]->id,
            'status' => 'absent',
            'note' => 'Called parent',
        ]);
    }

    public function test_admin_can_update_attendance_session(): void
    {
        $user = User::factory()->create();
        $schoolClass = SchoolClass::factory()->create();
        $students = Student::factory()->count(2)->for($schoolClass)->create();
        $session = AttendanceSession::factory()->for($schoolClass)->create([
            'attendance_date' => '2026-05-07',
            'period' => 'morning',
        ]);
        AttendanceRecord::factory()->for($session)->for($students[0])->create(['status' => 'present']);

        $this->actingAs($user)
            ->put(route('admin.attendance.update', $session), [
                'school_class_id' => $schoolClass->id,
                'attendance_date' => '2026-05-08',
                'period' => 'afternoon',
                'records' => [
                    ['student_id' => $students[0]->id, 'status' => 'late', 'note' => null],
                    ['student_id' => $students[1]->id, 'status' => 'excused', 'note' => 'Approved leave'],
                ],
            ])
            ->assertRedirect(route('admin.attendance'));

        $this->assertDatabaseHas('attendance_sessions', [
            'id' => $session->id,
            'attendance_date' => '2026-05-08',
            'period' => 'afternoon',
            'updated_by' => $user->id,
        ]);

        $this->assertDatabaseHas('attendance_records', [
            'attendance_session_id' => $session->id,
            'student_id' => $students[0]->id,
            'status' => 'late',
        ]);
        $this->assertDatabaseHas('attendance_records', [
            'attendance_session_id' => $session->id,
            'student_id' => $students[1]->id,
            'status' => 'excused',
            'note' => 'Approved leave',
        ]);
    }

    public function test_admin_can_update_attendance_session_without_changing_period(): void
    {
        $user = User::factory()->create();
        $schoolClass = SchoolClass::factory()->create();
        $students = Student::factory()->count(2)->for($schoolClass)->create();
        $session = AttendanceSession::factory()->for($schoolClass)->create([
            'attendance_date' => '2026-05-07',
            'period' => 'morning',
        ]);

        $this->actingAs($user)
            ->put(route('admin.attendance.update', $session), [
                'school_class_id' => $schoolClass->id,
                'attendance_date' => '2026-05-07',
                'period' => 'morning',
                'records' => [
                    ['student_id' => $students[0]->id, 'status' => 'present', 'note' => null],
                    ['student_id' => $students[1]->id, 'status' => 'absent', 'note' => 'Called parent'],
                ],
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('admin.attendance'));

        $session->refresh();

        $this->assertSame('2026-05-07', $session->attendance_date->toDateString());
        $this->assertSame('morning', $session->period);
        $this->assertSame($user->id, $session->updated_by);
    }

    public function test_admin_can_delete_attendance_session(): void
    {
        $this->actingAs(User::factory()->create());

        $session = AttendanceSession::factory()->create();
        AttendanceRecord::factory()->for($session)->create();

        $this->delete(route('admin.attendance.destroy', $session))
            ->assertRedirect(route('admin.attendance'));

        $this->assertDatabaseMissing('attendance_sessions', [
            'id' => $session->id,
        ]);
        $this->assertDatabaseMissing('attendance_records', [
            'attendance_session_id' => $session->id,
        ]);
    }
}
