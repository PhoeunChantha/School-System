<?php

namespace Tests\Feature;

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
        SchoolClass::factory()->for($teacher)->create(['name' => 'Beginner 1']);

        $this->get(route('admin.teachers'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/teachers/index')
                ->has('teachers', 1)
                ->where('teachers.0.nameEn', 'Mr. Vuthy')
                ->where('teachers.0.photo', asset('uploads/teachers/vuthy.jpg'))
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

    public function test_admin_can_delete_teacher(): void
    {
        $this->actingAs(User::factory()->create());

        $teacher = Teacher::factory()->create();

        $this->delete(route('admin.teachers.destroy', $teacher))
            ->assertRedirect(route('admin.teachers'));

        $this->assertSoftDeleted($teacher);
    }
}
