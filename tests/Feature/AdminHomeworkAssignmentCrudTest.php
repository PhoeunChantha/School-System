<?php

namespace Tests\Feature;

use App\Models\HomeworkAssignment;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
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

    public function test_admin_can_create_homework_with_file(): void
    {
        $user = User::factory()->create();
        $schoolClass = SchoolClass::factory()->create();

        $payload = $this->validPayload($schoolClass->id);
        $payload['attachment_file'] = UploadedFile::fake()->create('homework.docx', 128, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        $this->actingAs($user)
            ->post(route('admin.homework.store'), $payload)
            ->assertRedirect(route('admin.homework'));

        $homework = HomeworkAssignment::query()->where('title_en', 'Write about family')->firstOrFail();

        $this->assertSame('homework.docx', $homework->attachment_name);
        $this->assertNotNull($homework->attachment_path);
        $this->assertStringStartsWith('uploads/homework/', $homework->attachment_path);
        $this->assertFileExists(public_path($homework->attachment_path));

        unlink(public_path($homework->attachment_path));
    }

    public function test_admin_can_view_edit_homework_page(): void
    {
        $this->actingAs(User::factory()->create());

        $homework = HomeworkAssignment::factory()->create(['title_en' => 'Write about family']);

        $this->get(route('admin.homework.edit', $homework))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/homework/edit')
                ->where('homework.title_en', 'Write about family')
                ->where('homework.attachment_name', ''));
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
