<?php

namespace App\Support;

use App\Models\HomeworkSubmission;
use App\Models\HomeworkSubmissionRead;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class HomeworkSubmissionAlerts
{
    public function unreadCount(User $user): int
    {
        return $this->unreadQuery($user)->count();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function latestUnread(User $user): ?array
    {
        $submission = $this->unreadQuery($user)
            ->with([
                'homeworkAssignment:id,title_en,title_kh,school_class_id',
                'homeworkAssignment.schoolClass:id,name',
                'student:id,name_en,name_kh,school_class_id',
                'student.schoolClass:id,name',
            ])
            ->latest('submitted_at')
            ->first();

        if (! $submission) {
            return null;
        }

        return [
            'id' => $submission->id,
            'routeKey' => $submission->routeKey(),
            'studentName' => $submission->student?->name_en
                ?: $submission->student?->name_kh
                ?: 'Student',
            'assignmentTitle' => $submission->homeworkAssignment?->title_en
                ?: $submission->homeworkAssignment?->title_kh
                ?: 'Homework',
            'className' => $submission->homeworkAssignment?->schoolClass?->name
                ?: $submission->student?->schoolClass?->name
                ?: '',
            'submittedAt' => $submission->submitted_at?->format('Y-m-d H:i') ?? '',
        ];
    }

    public function markAllRead(User $user): void
    {
        $now = now();

        DB::transaction(function () use ($now, $user): void {
            $this->unreadQuery($user)
                ->select('id')
                ->lazyById()
                ->each(function (HomeworkSubmission $submission) use ($now, $user): void {
                    HomeworkSubmissionRead::query()->updateOrCreate(
                        [
                            'homework_submission_id' => $submission->id,
                            'user_id' => $user->id,
                        ],
                        ['read_at' => $now],
                    );
                });
        });
    }

    public function forgetReads(HomeworkSubmission $submission): void
    {
        $submission->reads()->delete();
    }

    /**
     * @return Builder<HomeworkSubmission>
     */
    private function unreadQuery(User $user): Builder
    {
        return HomeworkSubmission::query()
            ->submittedForReview()
            ->whereDoesntHave('reads', function (Builder $query) use ($user): void {
                $query->where('user_id', $user->id);
            });
    }
}
