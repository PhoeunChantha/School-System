<?php

namespace Tests\Feature;

use App\Models\HomeworkAssignment;
use App\Models\LessonPlan;
use App\Models\Notification;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentPortalNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_view_messages_without_lesson_plan_details(): void
    {
        $user = User::factory()->create();
        $student = Student::factory()->create(['user_id' => $user->id]);

        Notification::factory()->create([
            'category' => 'message',
            'title' => 'Class message',
            'body' => 'Your teacher shared a new class update. Please check with your teacher in class.',
            'student_id' => $student->id,
            'user_id' => $user->id,
            'data' => ['type' => 'class_message', 'school_class_id' => $student->school_class_id],
        ]);

        $this->actingAs($user)
            ->get(route('student.notifications'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('student/notifications/index')
                ->has('notifications.0.routeKey')
                ->where('notifications.0.title', 'Class message')
                ->where('notifications.0.body', 'Your teacher shared a new class update. Please check with your teacher in class.')
                ->where('notifications.0.category', 'message'));
    }

    public function test_student_can_mark_visible_messages_as_read(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $student = Student::factory()->create(['user_id' => $user->id]);
        $otherStudent = Student::factory()->create(['user_id' => $otherUser->id]);

        $visibleNotification = Notification::factory()->create([
            'student_id' => $student->id,
            'user_id' => $user->id,
        ]);
        $otherNotification = Notification::factory()->create([
            'student_id' => $otherStudent->id,
            'user_id' => $otherUser->id,
        ]);

        $this->actingAs($user)
            ->put(route('student.notifications.read'))
            ->assertRedirect();

        $this->assertNotNull($visibleNotification->fresh()->read_at);
        $this->assertNull($otherNotification->fresh()->read_at);
    }

    public function test_student_can_open_homework_message_detail(): void
    {
        $user = User::factory()->create();
        $schoolClass = SchoolClass::factory()->create();
        $student = Student::factory()->for($schoolClass)->create(['user_id' => $user->id]);
        $homework = HomeworkAssignment::factory()->for($schoolClass)->create([
            'title_en' => 'Reading Exercise Chapter 1',
            'instructions' => 'Read and answer the questions.',
            'points' => 84,
        ]);
        $notification = Notification::factory()->create([
            'category' => 'message',
            'title' => 'Homework update',
            'student_id' => $student->id,
            'user_id' => $user->id,
            'data' => [
                'type' => 'homework_update',
                'homework_assignment_id' => $homework->id,
                'school_class_id' => $schoolClass->id,
            ],
        ]);

        $this->actingAs($user)
            ->get(route('student.notifications.show', $notification))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('student/notifications/show')
                ->where('detail.type', 'homework')
                ->where('detail.title', 'Reading Exercise Chapter 1')
                ->where('detail.instructions', 'Read and answer the questions.')
                ->where('detail.points', 84));

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_student_can_open_lesson_plan_message_detail(): void
    {
        $user = User::factory()->create();
        $teacher = Teacher::factory()->create(['name_en' => 'Bou Vanna']);
        $schoolClass = SchoolClass::factory()->for($teacher)->create();
        $student = Student::factory()->for($schoolClass)->create(['user_id' => $user->id]);
        $lessonPlan = LessonPlan::factory()->for($teacher)->for($schoolClass)->create([
            'title' => 'Present Simple Tense',
            'objective' => 'Students can form positive sentences.',
            'content' => 'Warm-up and guided practice.',
            'materials' => 'Workbook',
            'homework' => 'Exercise A',
        ]);
        $notification = Notification::factory()->create([
            'category' => 'message',
            'title' => 'Class message',
            'student_id' => $student->id,
            'user_id' => $user->id,
            'data' => [
                'type' => 'class_message',
                'lesson_plan_id' => $lessonPlan->id,
                'school_class_id' => $schoolClass->id,
            ],
        ]);

        $this->actingAs($user)
            ->get(route('student.notifications.show', $notification))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('student/notifications/show')
                ->where('detail.type', 'lesson_plan')
                ->where('detail.title', 'Present Simple Tense')
                ->where('detail.teacher', 'Bou Vanna')
                ->where('detail.objective', 'Students can form positive sentences.')
                ->where('detail.content', 'Warm-up and guided practice.'));
    }

    public function test_student_cannot_open_another_students_message_detail(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        Student::factory()->create(['user_id' => $user->id]);
        $otherStudent = Student::factory()->create(['user_id' => $otherUser->id]);
        $notification = Notification::factory()->create([
            'student_id' => $otherStudent->id,
            'user_id' => $otherUser->id,
        ]);

        $this->actingAs($user)
            ->get(route('student.notifications.show', $notification))
            ->assertNotFound();
    }
}
