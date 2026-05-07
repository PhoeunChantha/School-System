<?php

namespace Tests\Feature;

use App\Models\Level;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminStudentCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_students_page(): void
    {
        $this->actingAs(User::factory()->create());

        Student::factory()->create(['name_en' => 'Sokh Dara']);

        $this->get(route('admin.students'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/students/index')
                ->has('students', 1)
                ->where('students.0.nameEn', 'Sokh Dara'));
    }

    public function test_admin_can_view_create_student_page(): void
    {
        $this->actingAs(User::factory()->create());

        $level = Level::factory()->create(['name' => 'Beginner 1']);
        SchoolClass::factory()->for($level)->create(['name' => 'Beginner 1']);

        $this->get(route('admin.students.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/students/create')
                ->has('levels', 1)
                ->has('classes', 1));
    }

    public function test_admin_can_create_student(): void
    {
        $user = User::factory()->create();
        $level = Level::factory()->create();
        $schoolClass = SchoolClass::factory()->for($level)->create();

        $this->actingAs($user)
            ->post(route('admin.students.store'), $this->validPayload($level->id, $schoolClass->id))
            ->assertRedirect(route('admin.students'));

        $this->assertDatabaseHas('students', [
            'level_id' => $level->id,
            'school_class_id' => $schoolClass->id,
            'name_en' => 'Sokh Dara',
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_view_edit_student_page(): void
    {
        $this->actingAs(User::factory()->create());

        $student = Student::factory()->create(['name_en' => 'Sokh Dara']);

        $this->get(route('admin.students.edit', $student))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/students/edit')
                ->where('student.name_en', 'Sokh Dara'));
    }

    public function test_admin_can_update_student(): void
    {
        $user = User::factory()->create();
        $student = Student::factory()->create(['name_en' => 'Sokh Dara']);

        $payload = $this->validPayload($student->level_id, $student->school_class_id);
        $payload['name_en'] = 'Sokh Dara Updated';
        $payload['fee_status'] = 'paid';

        $this->actingAs($user)
            ->put(route('admin.students.update', $student), $payload)
            ->assertRedirect(route('admin.students'));

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'name_en' => 'Sokh Dara Updated',
            'fee_status' => 'paid',
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_delete_student(): void
    {
        $this->actingAs(User::factory()->create());

        $student = Student::factory()->create();

        $this->delete(route('admin.students.destroy', $student))
            ->assertRedirect(route('admin.students'));

        $this->assertSoftDeleted($student);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(int $levelId, int $schoolClassId): array
    {
        return [
            'level_id' => $levelId,
            'school_class_id' => $schoolClassId,
            'code' => 'STU-1001',
            'name_kh' => 'សុខ ដារ៉ា',
            'name_en' => 'Sokh Dara',
            'date_of_birth' => '2012-01-01',
            'gender' => 'male',
            'province' => 'Prey Veng',
            'district' => 'Kampong Trabek',
            'commune' => 'Commune',
            'village' => 'Village',
            'parent_phone' => '012345678',
            'telegram_username' => '@parent',
            'monthly_fee' => 25,
            'scholarship_amount' => 0,
            'fee_status' => 'unpaid',
            'status' => 'active',
            'enrolled_on' => '2026-05-07',
        ];
    }
}
