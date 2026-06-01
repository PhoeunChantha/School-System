<?php

namespace App\Events;

use App\Models\HomeworkSubmission;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class HomeworkSubmissionSubmitted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public HomeworkSubmission $submission) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('admin.homework-submissions')];
    }

    public function broadcastAs(): string
    {
        return 'homework.submission.submitted';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $this->submission->loadMissing([
            'homeworkAssignment:id,title_en,title_kh,school_class_id',
            'homeworkAssignment.schoolClass:id,name',
            'student:id,name_en,name_kh,school_class_id',
            'student.schoolClass:id,name',
        ]);

        return [
            'submission' => [
                'id' => $this->submission->id,
                'routeKey' => $this->submission->routeKey(),
                'studentName' => $this->submission->student?->name_en
                    ?: $this->submission->student?->name_kh
                    ?: 'Student',
                'assignmentTitle' => $this->submission->homeworkAssignment?->title_en
                    ?: $this->submission->homeworkAssignment?->title_kh
                    ?: 'Homework',
                'className' => $this->submission->homeworkAssignment?->schoolClass?->name
                    ?: $this->submission->student?->schoolClass?->name
                    ?: '',
                'submittedAt' => $this->submission->submitted_at?->format('Y-m-d H:i') ?? '',
            ],
        ];
    }
}
