<?php

namespace Tests\Feature;

use App\Models\Certificate;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\HomeworkAssignment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentPortalAddOnsTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_add_on_pages_render_for_linked_student(): void
    {
        $user = User::factory()->create();
        Student::factory()->create(['user_id' => $user->id]);

        $pages = [
            ['student.exams', 'student/exams/index'],
            ['student.exam-results', 'student/exam-results/index'],
            ['student.class-schedule', 'student/class-schedule/index'],
            ['student.learning-materials', 'student/learning-materials/index'],
            ['student.attendance-calendar', 'student/attendance-calendar/index'],
            ['student.homework-calendar', 'student/homework-calendar/index'],
            ['student.id-card', 'student/id-card/index'],
        ];

        foreach ($pages as [$route, $component]) {
            $this->actingAs($user)
                ->get(route($route))
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component($component)
                    ->has('profile'));
        }
    }

    public function test_student_class_schedule_includes_teacher_photo_and_class_times(): void
    {
        $user = User::factory()->create();
        $teacher = Teacher::factory()->create([
            'name_en' => 'Sok Dara',
            'profile_photo' => 'uploads/teachers/sok-dara.jpg',
        ]);
        $schoolClass = SchoolClass::factory()->for($teacher)->create([
            'starts_at' => '07:00:00',
            'ends_at' => '09:00:00',
        ]);
        Student::factory()->for($schoolClass)->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->get(route('student.class-schedule'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('student/class-schedule/index')
                ->where('schedule.teacher', 'Sok Dara')
                ->where('schedule.teacherPhoto', asset('uploads/teachers/sok-dara.jpg'))
                ->where('schedule.startsAt', '07:00:00')
                ->where('schedule.endsAt', '09:00:00'));
    }

    public function test_student_dashboard_counts_issued_certificates_instead_of_fee_due(): void
    {
        $this->withoutVite();

        $user = User::factory()->create();
        $student = Student::factory()->create(['user_id' => $user->id]);

        Certificate::factory()->for($student)->create(['status' => 'issued']);
        Certificate::factory()->for($student)->create(['status' => 'draft']);

        $this->actingAs($user)
            ->get(route('student.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('student/dashboard/index')
                ->where('stats.certificatesIssued', 1)
                ->where('translations.student.en.content_text.Welcome back', 'Welcome back')
                ->where('translations.student.kh.content_text.Welcome back', 'សូមស្វាគមន៍')
                ->missing('stats.unpaidFees'));
    }

    public function test_student_dashboard_homework_count_matches_assigned_homework_total(): void
    {
        $user = User::factory()->create();
        $student = Student::factory()->create(['user_id' => $user->id]);

        HomeworkAssignment::factory()->count(4)->create([
            'school_class_id' => $student->school_class_id,
        ]);
        HomeworkAssignment::factory()->create();

        $this->actingAs($user)
            ->get(route('student.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('stats.homeworkTotal', 4)
                ->missing('stats.homeworkSubmitted'));
    }

    public function test_student_can_view_exam_detail_for_own_class(): void
    {
        $user = User::factory()->create();
        $student = Student::factory()->create(['user_id' => $user->id]);
        $exam = Exam::factory()->create([
            'school_class_id' => $student->school_class_id,
            'title' => 'Monthly English Test',
            'subject' => 'English',
            'exam_date' => now()->subDay()->format('Y-m-d'),
            'duration_minutes' => 60,
            'content' => ['html' => '<p>Read all questions carefully.</p>'],
        ]);

        ExamResult::factory()
            ->for($exam)
            ->for($student)
            ->create([
                'score' => 85,
                'max_score' => 100,
                'status' => 'passed',
                'note' => 'Strong result.',
            ]);

        $this->actingAs($user)
            ->get(route('student.exams.show', $exam))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('student/exams/show')
                ->where('exam.title', 'Monthly English Test')
                ->where('exam.routeKey', fn (string $routeKey): bool => filled($routeKey))
                ->where('exam.subject', 'English')
                ->where('exam.result.score', 85)
                ->where('exam.result.status', 'passed'));
    }

    public function test_student_cannot_view_exam_detail_for_another_class(): void
    {
        $user = User::factory()->create();
        Student::factory()->create(['user_id' => $user->id]);
        $exam = Exam::factory()->create([
            'school_class_id' => SchoolClass::factory(),
        ]);

        $this->actingAs($user)
            ->get(route('student.exams.show', $exam))
            ->assertNotFound();
    }
}
