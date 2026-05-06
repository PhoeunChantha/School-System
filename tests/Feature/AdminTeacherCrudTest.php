<?php

namespace Tests\Feature;

use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTeacherCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_teachers_page(): void
    {
        $this->actingAs(User::factory()->create());

        $teacher = Teacher::factory()->create(['name_en' => 'Mr. Vuthy']);
        SchoolClass::factory()->for($teacher)->create(['name' => 'Beginner 1']);

        $this->get(route('admin.teachers'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/teachers/index')
                ->has('teachers', 1)
                ->where('teachers.0.nameEn', 'Mr. Vuthy')
                ->where('teachers.0.classes', 1)
                ->has('teachers.0.schedule', 1));
    }

    public function test_admin_can_create_teacher(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('admin.teachers.store'), [
                'name_kh' => 'គ្រូ វុទ្ធី',
                'name_en' => 'Mr. Vuthy',
                'subject' => 'English Grammar',
                'phone' => '012345678',
                'telegram_username' => '@vuthy',
                'status' => 'active',
            ])
            ->assertRedirect(route('admin.teachers'));

        $this->assertDatabaseHas('teachers', [
            'name_kh' => 'គ្រូ វុទ្ធី',
            'name_en' => 'Mr. Vuthy',
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_update_teacher(): void
    {
        $user = User::factory()->create();
        $teacher = Teacher::factory()->create(['name_en' => 'Mr. Vuthy']);

        $this->actingAs($user)
            ->put(route('admin.teachers.update', $teacher), [
                'name_kh' => 'គ្រូ រ៉ានី',
                'name_en' => 'Ms. Rani',
                'subject' => 'Conversation',
                'phone' => '017234567',
                'telegram_username' => '@rani',
                'status' => 'inactive',
            ])
            ->assertRedirect(route('admin.teachers'));

        $this->assertDatabaseHas('teachers', [
            'id' => $teacher->id,
            'name_en' => 'Ms. Rani',
            'status' => 'inactive',
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_delete_teacher(): void
    {
        $this->actingAs(User::factory()->create());

        $teacher = Teacher::factory()->create();

        $this->delete(route('admin.teachers.destroy', $teacher))
            ->assertRedirect(route('admin.teachers'));

        $this->assertSoftDeleted($teacher);
    }
}
