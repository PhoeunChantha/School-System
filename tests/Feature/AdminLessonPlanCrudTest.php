<?php

namespace Tests\Feature;

use App\Models\LessonPlan;
use App\Models\Notification;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use App\Services\Backends\LessonPlanService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Mockery\MockInterface;
use RuntimeException;
use Tests\TestCase;

class AdminLessonPlanCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_lesson_plans_page(): void
    {
        $this->actingAs(User::factory()->create());

        $teacher = Teacher::factory()->create(['name_en' => 'Mr. Vuthy']);
        $schoolClass = SchoolClass::factory()->for($teacher)->create(['name' => 'Beginner 1A']);
        LessonPlan::factory()
            ->for($teacher)
            ->for($schoolClass)
            ->create([
                'lesson_date' => today(),
                'title' => 'Present Simple Tense',
            ]);

        $this->get(route('admin.lesson-plans'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/lesson-plans/index')
                ->has('lessonPlans', 1)
                ->where('lessonPlans.0.title', 'Present Simple Tense')
                ->where('lessonPlans.0.teacher', 'Mr. Vuthy')
                ->where('lessonPlans.0.className', 'Beginner 1A')
                ->where('summary.today', 1));
    }

    public function test_admin_can_view_lesson_plan_detail_page(): void
    {
        $user = User::factory()->create();
        $teacher = Teacher::factory()->create(['name_en' => 'Ms. Lina']);
        $schoolClass = SchoolClass::factory()->for($teacher)->create([
            'name' => 'Advanced A',
            'room' => 'R08',
        ]);
        $lessonPlan = LessonPlan::factory()
            ->for($teacher)
            ->for($schoolClass)
            ->create([
                'created_by' => $user->id,
                'updated_by' => $user->id,
                'title' => 'Speaking Practice',
                'objective' => 'Students can introduce themselves clearly.',
            ]);

        $this->actingAs($user)
            ->get(route('admin.lesson-plans.show', $lessonPlan))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/lesson-plans/show')
                ->where('lessonPlan.title', 'Speaking Practice')
                ->where('lessonPlan.teacher', 'Ms. Lina')
                ->where('lessonPlan.className', 'Advanced A')
                ->where('lessonPlan.room', 'R08')
                ->where('lessonPlan.createdBy', $user->name));
    }

    public function test_admin_can_create_lesson_plan(): void
    {
        $user = User::factory()->create();
        $teacher = Teacher::factory()->create();
        $schoolClass = SchoolClass::factory()->for($teacher)->create();
        $studentUser = User::factory()->create();
        $student = Student::factory()->for($schoolClass)->create(['user_id' => $studentUser->id]);

        $this->actingAs($user)
            ->post(route('admin.lesson-plans.store'), [
                'teacher_id' => $teacher->id,
                'school_class_id' => $schoolClass->id,
                'lesson_date' => today()->toDateString(),
                'title' => 'Present Simple Tense',
                'objective' => 'Students can write positive and negative sentences.',
                'content' => 'Warm-up, examples, guided practice.',
                'materials' => 'Workbook page 12',
                'homework' => 'Exercise A and B',
                'status' => 'planned',
            ])
            ->assertRedirect(route('admin.lesson-plans'));

        $this->assertDatabaseHas('lesson_plans', [
            'teacher_id' => $teacher->id,
            'school_class_id' => $schoolClass->id,
            'title' => 'Present Simple Tense',
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $lessonPlan = LessonPlan::query()->where('title', 'Present Simple Tense')->firstOrFail();

        $this->assertDatabaseHas('notifications', [
            'category' => 'message',
            'title' => 'Class message',
            'body' => 'Your teacher shared a new class update. Please check with your teacher in class.',
            'student_id' => $student->id,
            'user_id' => $studentUser->id,
            'created_by' => $user->id,
        ]);

        $notification = Notification::query()->where('student_id', $student->id)->firstOrFail();
        $this->assertSame('class_message', $notification->data['type']);
        $this->assertSame($lessonPlan->id, $notification->data['lesson_plan_id']);
        $this->assertStringNotContainsString($lessonPlan->title, $notification->body);
    }

    public function test_admin_can_create_file_based_lesson_plan_with_multiple_attachments(): void
    {
        $user = User::factory()->create();
        $teacher = Teacher::factory()->create();
        $schoolClass = SchoolClass::factory()->for($teacher)->create();

        $response = $this->actingAs($user)
            ->post(route('admin.lesson-plans.store'), [
                'teacher_id' => $teacher->id,
                'school_class_id' => $schoolClass->id,
                'lesson_date' => today()->toDateString(),
                'input_mode' => 'files',
                'title' => null,
                'status' => 'planned',
                'attachments' => [
                    UploadedFile::fake()->image('lesson-page.jpg'),
                    UploadedFile::fake()->create('worksheet.pdf', 250, 'application/pdf'),
                ],
            ]);

        $response->assertRedirect(route('admin.lesson-plans'));

        $lessonPlan = LessonPlan::query()->where('input_mode', 'files')->firstOrFail();
        $this->assertSame('lesson-page', $lessonPlan->title);
        $this->assertCount(2, $lessonPlan->attachments);
        $this->assertNull($lessonPlan->objective);

        foreach ($lessonPlan->attachments as $attachment) {
            $this->assertFileExists(public_path($attachment->path));
            File::delete(public_path($attachment->path));
        }
    }

    public function test_file_based_lesson_plan_requires_an_attachment(): void
    {
        $teacher = Teacher::factory()->create();
        $schoolClass = SchoolClass::factory()->for($teacher)->create();

        $this->actingAs(User::factory()->create())
            ->from(route('admin.lesson-plans.create'))
            ->post(route('admin.lesson-plans.store'), [
                'teacher_id' => $teacher->id,
                'school_class_id' => $schoolClass->id,
                'lesson_date' => today()->toDateString(),
                'input_mode' => 'files',
                'status' => 'planned',
            ])
            ->assertRedirect(route('admin.lesson-plans.create'))
            ->assertSessionHasErrors('attachments');
    }

    public function test_create_failure_returns_a_form_error_instead_of_success(): void
    {
        $teacher = Teacher::factory()->create();
        $schoolClass = SchoolClass::factory()->for($teacher)->create();

        $this->mock(LessonPlanService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('create')
                ->once()
                ->andThrow(new RuntimeException('Upload failed.'));
        });

        $this->actingAs(User::factory()->create())
            ->from(route('admin.lesson-plans.create'))
            ->post(route('admin.lesson-plans.store'), [
                'teacher_id' => $teacher->id,
                'school_class_id' => $schoolClass->id,
                'lesson_date' => today()->toDateString(),
                'title' => 'Present Simple Tense',
                'status' => 'planned',
            ])
            ->assertRedirect(route('admin.lesson-plans.create'))
            ->assertSessionHasErrors('form')
            ->assertSessionMissing('success');
    }

    public function test_admin_can_update_lesson_plan(): void
    {
        $user = User::factory()->create();
        $lessonPlan = LessonPlan::factory()->create(['title' => 'Old Lesson']);
        $teacher = Teacher::factory()->create();
        $schoolClass = SchoolClass::factory()->for($teacher)->create();

        $this->actingAs($user)
            ->put(route('admin.lesson-plans.update', $lessonPlan), [
                'teacher_id' => $teacher->id,
                'school_class_id' => $schoolClass->id,
                'lesson_date' => today()->addDay()->toDateString(),
                'title' => 'Conversation Practice',
                'objective' => 'Students can ask and answer daily routine questions.',
                'content' => null,
                'materials' => null,
                'homework' => null,
                'status' => 'taught',
            ])
            ->assertRedirect(route('admin.lesson-plans'));

        $this->assertDatabaseHas('lesson_plans', [
            'id' => $lessonPlan->id,
            'teacher_id' => $teacher->id,
            'school_class_id' => $schoolClass->id,
            'title' => 'Conversation Practice',
            'status' => 'taught',
            'updated_by' => $user->id,
        ]);
    }

    public function test_lesson_plan_notification_rule_can_disable_student_notifications(): void
    {
        $user = User::factory()->create();
        $teacher = Teacher::factory()->create();
        $schoolClass = SchoolClass::factory()->for($teacher)->create();
        Student::factory()->for($schoolClass)->create(['user_id' => User::factory()->create()->id]);

        SchoolSetting::query()->create([
            'group' => 'notifications',
            'key' => 'preferences',
            'value' => [
                'lessonPlanAlert' => false,
            ],
        ]);

        $this->actingAs($user)
            ->post(route('admin.lesson-plans.store'), [
                'teacher_id' => $teacher->id,
                'school_class_id' => $schoolClass->id,
                'lesson_date' => today()->toDateString(),
                'title' => 'Present Simple Tense',
                'objective' => 'Students can write positive and negative sentences.',
                'content' => 'Warm-up, examples, guided practice.',
                'materials' => 'Workbook page 12',
                'homework' => 'Exercise A and B',
                'status' => 'planned',
            ])
            ->assertRedirect(route('admin.lesson-plans'));

        $this->assertDatabaseHas('lesson_plans', [
            'school_class_id' => $schoolClass->id,
            'title' => 'Present Simple Tense',
        ]);

        $this->assertDatabaseMissing('notifications', [
            'title' => 'Class message',
        ]);
    }

    public function test_admin_can_delete_lesson_plan(): void
    {
        $this->actingAs(User::factory()->create());

        $lessonPlan = LessonPlan::factory()->create();

        $this->delete(route('admin.lesson-plans.destroy', $lessonPlan))
            ->assertRedirect(route('admin.lesson-plans'));

        $this->assertSoftDeleted($lessonPlan);
    }
}
