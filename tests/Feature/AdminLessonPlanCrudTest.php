<?php

namespace Tests\Feature;

use App\Models\LessonPlan;
use App\Models\Notification;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
