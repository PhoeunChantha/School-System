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
