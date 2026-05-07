<?php

namespace Tests\Feature;

use App\Models\HomeworkAssignment;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminHomeworkAssignmentCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_homework_page(): void
    {
        $this->actingAs(User::factory()->create());

        $schoolClass = SchoolClass::factory()->create(['name' => 'Beginner 1']);
        HomeworkAssignment::factory()->for($schoolClass)->create(['title_en' => 'Write about family']);

        $this->get(route('admin.homework'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/homework/index')
                ->has('homework', 1)
                ->where('homework.0.titleEn', 'Write about family')
                ->where('homework.0.className', 'Beginner 1'));
    }

    public function test_admin_can_view_create_homework_page(): void
    {
        $this->actingAs(User::factory()->create());

        SchoolClass::factory()->create(['name' => 'Beginner 1']);

        $this->get(route('admin.homework.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/homework/create')
                ->has('classes', 1));
    }

    public function test_admin_can_create_homework(): void
    {
        $user = User::factory()->create();
        $schoolClass = SchoolClass::factory()->create();

        $this->actingAs($user)
            ->post(route('admin.homework.store'), $this->validPayload($schoolClass->id))
            ->assertRedirect(route('admin.homework'));

        $this->assertDatabaseHas('homework_assignments', [
            'school_class_id' => $schoolClass->id,
            'title_en' => 'Write about family',
            'assigned_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_view_edit_homework_page(): void
    {
        $this->actingAs(User::factory()->create());

        $homework = HomeworkAssignment::factory()->create(['title_en' => 'Write about family']);

        $this->get(route('admin.homework.edit', $homework))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/homework/edit')
                ->where('homework.title_en', 'Write about family'));
    }

    public function test_admin_can_update_homework(): void
    {
        $user = User::factory()->create();
        $homework = HomeworkAssignment::factory()->create(['title_en' => 'Write about family']);

        $payload = $this->validPayload($homework->school_class_id);
        $payload['title_en'] = 'Write about school';
        $payload['status'] = 'closed';

        $this->actingAs($user)
            ->put(route('admin.homework.update', $homework), $payload)
            ->assertRedirect(route('admin.homework'));

        $this->assertDatabaseHas('homework_assignments', [
            'id' => $homework->id,
            'title_en' => 'Write about school',
            'status' => 'closed',
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_delete_homework(): void
    {
        $this->actingAs(User::factory()->create());

        $homework = HomeworkAssignment::factory()->create();

        $this->delete(route('admin.homework.destroy', $homework))
            ->assertRedirect(route('admin.homework'));

        $this->assertDatabaseMissing('homework_assignments', [
            'id' => $homework->id,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(int $schoolClassId): array
    {
        return [
            'school_class_id' => $schoolClassId,
            'title_kh' => 'កិច្ចការសរសេរ',
            'title_en' => 'Write about family',
            'instructions' => 'Write one page.',
            'points' => 100,
            'due_on' => '2026-05-14',
            'academic_year' => '2026',
            'status' => 'assigned',
        ];
    }
}
