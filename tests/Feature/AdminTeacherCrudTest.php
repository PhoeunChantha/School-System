<?php

namespace Tests\Feature;

use App\Models\LessonPlan;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class AdminTeacherCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_teachers_page(): void
    {
        $this->actingAs(User::factory()->create());

        $teacher = Teacher::factory()->create([
            'name_en' => 'Mr. Vuthy',
            'profile_photo' => 'uploads/teachers/vuthy.jpg',
        ]);
        $schoolClass = SchoolClass::factory()->for($teacher)->create(['name' => 'Beginner 1']);
        LessonPlan::factory()
            ->for($teacher)
            ->for($schoolClass)
            ->create([
                'lesson_date' => today(),
                'title' => 'Present Simple Tense',
            ]);

        $this->get(route('admin.teachers'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/teachers/index')
                ->has('teachers', 1)
                ->where('teachers.0.nameEn', 'Mr. Vuthy')
                ->where('teachers.0.photo', asset('uploads/teachers/vuthy.jpg'))
                ->where('teachers.0.classes', 1)
                ->where('teachers.0.lessons.0.title', 'Present Simple Tense')
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

    public function test_admin_can_create_teacher_with_profile_photo(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('admin.teachers.store'), [
                'name_kh' => 'Teacher Vuthy',
                'name_en' => 'Mr. Vuthy',
                'subject' => 'English Grammar',
                'phone' => '012345678',
                'telegram_username' => '@vuthy',
                'profile_photo' => UploadedFile::fake()->image('teacher.jpg'),
                'status' => 'active',
            ])
            ->assertRedirect(route('admin.teachers'));

        $teacher = Teacher::query()->where('name_en', 'Mr. Vuthy')->firstOrFail();

        $this->assertNotNull($teacher->profile_photo);
        $this->assertStringStartsWith('uploads/teachers/', $teacher->profile_photo);
        $this->assertFileExists(public_path($teacher->profile_photo));

        unlink(public_path($teacher->profile_photo));
    }

    public function test_admin_can_update_teacher_profile_photo(): void
    {
        $user = User::factory()->create();
        $oldPhotoPath = 'uploads/teachers/old-teacher.jpg';
        $oldPhotoFullPath = public_path($oldPhotoPath);

        if (! is_dir(dirname($oldPhotoFullPath))) {
            mkdir(dirname($oldPhotoFullPath), 0755, true);
        }

        file_put_contents($oldPhotoFullPath, 'old photo');

        $teacher = Teacher::factory()->create([
            'name_en' => 'Mr. Vuthy',
            'profile_photo' => $oldPhotoPath,
        ]);

        $this->actingAs($user)
            ->post(route('admin.teachers.update', $teacher), [
                '_method' => 'put',
                'name_kh' => 'Teacher Rani',
                'name_en' => 'Ms. Rani',
                'subject' => 'Conversation',
                'phone' => '017234567',
                'telegram_username' => '@rani',
                'profile_photo' => UploadedFile::fake()->image('teacher-new.jpg'),
                'status' => 'inactive',
            ])
            ->assertRedirect(route('admin.teachers'));

        $teacher->refresh();

        $this->assertNotSame($oldPhotoPath, $teacher->profile_photo);
        $this->assertFileDoesNotExist($oldPhotoFullPath);
        $this->assertNotNull($teacher->profile_photo);
        $this->assertFileExists(public_path($teacher->profile_photo));

        unlink(public_path($teacher->profile_photo));
    }

    public function test_admin_can_open_teacher_lesson_plan_form(): void
    {
        $this->actingAs(User::factory()->create());

        $teacher = Teacher::factory()->create(['name_en' => 'Mr. Vuthy']);
        SchoolClass::factory()->for($teacher)->create(['name' => 'Advanced A']);

        $this->get(route('admin.teachers.lesson-plans.create', $teacher))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/teachers/lesson-plan-form')
                ->where('teacher.id', $teacher->id)
                ->where('teacher.nameEn', 'Mr. Vuthy')
                ->has('classes', 1)
                ->where('classes.0.name', 'Advanced A'));
    }

    public function test_admin_can_create_lesson_plan_for_teacher(): void
    {
        $user = User::factory()->create();
        $teacher = Teacher::factory()->create();
        $schoolClass = SchoolClass::factory()->for($teacher)->create();

        $this->actingAs($user)
            ->post(route('admin.teachers.lesson-plans.store', $teacher), [
                'teacher_id' => $teacher->id,
                'school_class_id' => $schoolClass->id,
                'lesson_date' => '2026-05-13',
                'title' => 'Present Simple Tense',
                'objective' => 'Students can form positive sentences.',
                'content' => 'Warm-up and guided practice.',
                'materials' => 'Workbook',
                'homework' => 'Exercise A',
                'status' => 'planned',
            ])
            ->assertRedirect(route('admin.teachers'));

        $this->assertDatabaseHas('lesson_plans', [
            'teacher_id' => $teacher->id,
            'school_class_id' => $schoolClass->id,
            'lesson_date' => '2026-05-13',
            'title' => 'Present Simple Tense',
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    public function test_teacher_lesson_plan_requires_class_assigned_to_teacher(): void
    {
        $this->actingAs(User::factory()->create());

        $teacher = Teacher::factory()->create();
        $otherClass = SchoolClass::factory()->create();

        $this->post(route('admin.teachers.lesson-plans.store', $teacher), [
            'teacher_id' => $teacher->id,
            'school_class_id' => $otherClass->id,
            'lesson_date' => '2026-05-13',
            'title' => 'Present Simple Tense',
            'status' => 'planned',
        ])
            ->assertSessionHasErrors('school_class_id');

        $this->assertDatabaseMissing('lesson_plans', [
            'teacher_id' => $teacher->id,
            'school_class_id' => $otherClass->id,
            'title' => 'Present Simple Tense',
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

    public function test_admin_can_download_teacher_import_layout(): void
    {
        $this->actingAs(User::factory()->create());

        $response = $this->get(route('admin.teachers.layout'))
            ->assertOk()
            ->assertDownload('teachers-import-layout.csv');

        $this->assertStringContainsString('name_kh,name_en,subject,phone,telegram_username,status', $response->streamedContent());
    }

    public function test_admin_can_export_teachers(): void
    {
        $this->actingAs(User::factory()->create());

        Teacher::factory()->create([
            'name_en' => 'Export Teacher',
            'subject' => 'Writing Skills',
        ]);

        $response = $this->get(route('admin.teachers.export'))
            ->assertOk()
            ->assertDownload('teachers-export.csv');

        $this->assertStringContainsString('Export Teacher', $response->streamedContent());
        $this->assertStringContainsString('Writing Skills', $response->streamedContent());
    }

    public function test_admin_can_import_teachers_from_csv_layout(): void
    {
        $user = User::factory()->create();
        $csv = implode("\n", [
            'name_kh,name_en,subject,phone,telegram_username,status',
            'Teacher Khmer,Imported Teacher,Conversation,012345678,@teacher,active',
        ]);

        $this->actingAs($user)
            ->post(route('admin.teachers.import'), [
                'import_file' => UploadedFile::fake()->createWithContent('teachers.csv', $csv),
            ])
            ->assertRedirect(route('admin.teachers'));

        $this->assertDatabaseHas('teachers', [
            'name_en' => 'Imported Teacher',
            'subject' => 'Conversation',
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }
}
