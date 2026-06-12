<?php

namespace Tests\Feature;

use App\Models\Level;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminStudentEnrollmentHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_creation_and_academic_changes_are_recorded(): void
    {
        $user = User::factory()->create();
        $firstClass = SchoolClass::factory()->create();
        $nextLevel = Level::factory()->create();
        $nextClass = SchoolClass::factory()->for($nextLevel)->create();

        $student = Student::factory()->create([
            'level_id' => $firstClass->level_id,
            'school_class_id' => $firstClass->id,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $this->assertDatabaseHas('student_enrollment_histories', [
            'student_id' => $student->id,
            'event_type' => 'enrolled',
            'to_school_class_id' => $firstClass->id,
        ]);

        $student->update([
            'level_id' => $nextLevel->id,
            'school_class_id' => $nextClass->id,
            'updated_by' => $user->id,
        ]);

        $this->assertDatabaseHas('student_enrollment_histories', [
            'student_id' => $student->id,
            'event_type' => 'promotion',
            'from_level_id' => $firstClass->level_id,
            'to_level_id' => $nextLevel->id,
            'from_school_class_id' => $firstClass->id,
            'to_school_class_id' => $nextClass->id,
        ]);

        $student->update(['status' => 'inactive', 'updated_by' => $user->id]);

        $this->assertDatabaseHas('student_enrollment_histories', [
            'student_id' => $student->id,
            'event_type' => 'withdrawal',
            'from_status' => 'active',
            'to_status' => 'inactive',
        ]);

        $student->update(['status' => 'active']);
        $student->delete();

        $this->assertDatabaseHas('student_enrollment_histories', [
            'student_id' => $student->id,
            'event_type' => 'withdrawal',
            'from_status' => 'active',
            'to_status' => 'withdrawn',
            'note' => 'Student record archived',
        ]);
    }

    public function test_admin_can_view_enrollment_history_and_student_detail_timeline(): void
    {
        $student = Student::factory()->create();

        $this->actingAsAdmin()
            ->get(route('admin.enrollment-history'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/enrollment-history/index')
                ->has('histories', 1)
                ->where('histories.0.studentName', $student->name_en));

        $this->get(route('admin.students.show', $student))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('enrollmentHistory', 1));
    }

    private function actingAsAdmin(): self
    {
        $this->seed(PermissionSeeder::class);
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create();
        $user->syncRoles([Role::query()->where('name', 'admin')->firstOrFail()]);

        return $this->actingAs($user);
    }
}
