<?php

namespace Tests\Feature;

use App\Models\Level;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSchoolClassCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_classes_page(): void
    {
        $this->actingAs(User::factory()->create());

        $level = Level::factory()->create(['name' => 'Beginner 1']);
        $teacher = Teacher::factory()->create(['name_en' => 'Mr. Vuthy']);
        SchoolClass::factory()->for($level)->for($teacher)->create(['name' => 'Beginner 1']);

        $this->get(route('admin.classes'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/classes/index')
                ->has('classes', 1)
                ->where('classes.0.name', 'Beginner 1')
                ->has('levels', 1)
                ->has('teachers', 1));
    }

    public function test_admin_can_create_class(): void
    {
        $user = User::factory()->create();
        $level = Level::factory()->create();
        $teacher = Teacher::factory()->create();

        $this->actingAs($user)
            ->post(route('admin.classes.store'), [
                'level_id' => $level->id,
                'teacher_id' => $teacher->id,
                'name' => 'Beginner 1',
                'room' => 'A1',
                'starts_at' => '07:30',
                'ends_at' => '09:00',
                'days' => ['Mon', 'Wed', 'Fri'],
                'capacity' => 20,
                'academic_year' => '2026',
                'status' => 'active',
            ])
            ->assertRedirect(route('admin.classes'));

        $this->assertDatabaseHas('school_classes', [
            'level_id' => $level->id,
            'teacher_id' => $teacher->id,
            'name' => 'Beginner 1',
            'room' => 'A1',
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_update_class(): void
    {
        $user = User::factory()->create();
        $schoolClass = SchoolClass::factory()->create(['name' => 'Beginner 1']);
        $teacher = Teacher::factory()->create();

        $this->actingAs($user)
            ->put(route('admin.classes.update', $schoolClass), [
                'level_id' => $schoolClass->level_id,
                'teacher_id' => $teacher->id,
                'name' => 'Beginner 2',
                'room' => 'A2',
                'starts_at' => '09:15',
                'ends_at' => '10:45',
                'days' => ['Tue', 'Thu', 'Sat'],
                'capacity' => 25,
                'academic_year' => '2026',
                'status' => 'inactive',
            ])
            ->assertRedirect(route('admin.classes'));

        $this->assertDatabaseHas('school_classes', [
            'id' => $schoolClass->id,
            'teacher_id' => $teacher->id,
            'name' => 'Beginner 2',
            'room' => 'A2',
            'status' => 'inactive',
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_delete_class(): void
    {
        $this->actingAs(User::factory()->create());

        $schoolClass = SchoolClass::factory()->create();

        $this->delete(route('admin.classes.destroy', $schoolClass))
            ->assertRedirect(route('admin.classes'));

        $this->assertSoftDeleted($schoolClass);
    }
}
