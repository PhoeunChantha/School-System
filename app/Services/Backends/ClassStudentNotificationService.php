<?php

namespace App\Services\Backends;

use App\Events\StudentNotificationCreated;
use App\Models\HomeworkAssignment;
use App\Models\LessonPlan;
use App\Models\Notification;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Services\WebPushService;
use Illuminate\Support\Facades\DB;

class ClassStudentNotificationService
{
    public function __construct(private readonly WebPushService $webPush) {}

    public function homeworkAssigned(HomeworkAssignment $homeworkAssignment, ?int $userId): void
    {
        if (! $this->ruleEnabled('homeworkDue')) {
            return;
        }

        $this->createForClass(
            schoolClassId: $homeworkAssignment->school_class_id,
            userId: $userId,
            category: 'message',
            title: 'Homework update',
            body: 'Your teacher assigned new homework. Open the Homework tab to view and submit it.',
            data: [
                'type' => 'homework_update',
                'homework_assignment_id' => $homeworkAssignment->id,
                'school_class_id' => $homeworkAssignment->school_class_id,
            ],
        );
    }

    public function lessonPlanCreated(LessonPlan $lessonPlan, ?int $userId): void
    {
        if (! $this->ruleEnabled('lessonPlanAlert')) {
            return;
        }

        $this->createForClass(
            schoolClassId: $lessonPlan->school_class_id,
            userId: $userId,
            category: 'message',
            title: 'Class message',
            body: 'Your teacher shared a new class update. Please check with your teacher in class.',
            data: [
                'type' => 'class_message',
                'lesson_plan_id' => $lessonPlan->id,
                'school_class_id' => $lessonPlan->school_class_id,
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function createForClass(
        int $schoolClassId,
        ?int $userId,
        string $category,
        string $title,
        string $body,
        array $data,
    ): void {
        $students = Student::query()
            ->active()
            ->where('school_class_id', $schoolClassId)
            ->get(['id', 'user_id']);

        if ($students->isEmpty()) {
            return;
        }

        $students->each(function (Student $student) use ($category, $title, $body, $data, $userId): void {
            $notification = Notification::query()->create([
                'category' => $category,
                'title' => $title,
                'body' => $body,
                'severity' => 'info',
                'student_id' => $student->id,
                'user_id' => $student->user_id,
                'data' => $data,
                'created_by' => $userId,
            ]);

            $unreadNotifications = $this->unreadNotificationCount($student);

            DB::afterCommit(function () use ($notification, $unreadNotifications): void {
                event(new StudentNotificationCreated($notification, $unreadNotifications));
                $this->webPush->sendForNotification($notification);
            });
        });
    }

    private function unreadNotificationCount(Student $student): int
    {
        return Notification::query()
            ->whereNull('read_at')
            ->where(function ($query) use ($student): void {
                $query->where('student_id', $student->id)
                    ->orWhere('user_id', $student->user_id)
                    ->orWhereNull('student_id');
            })
            ->count();
    }

    private function ruleEnabled(string $key): bool
    {
        $setting = SchoolSetting::query()
            ->where('group', 'notifications')
            ->where('key', SchoolSettingService::GROUP_KEYS['notifications'])
            ->first(['value']);

        $value = $setting?->value;

        if (! is_array($value)) {
            return true;
        }

        return (bool) ($value[$key] ?? true);
    }
}
