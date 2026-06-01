<?php

use App\Models\HomeworkSubmission;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('students.{studentId}', function (User $user, int $studentId): bool {
    return Student::query()
        ->whereKey($studentId)
        ->where('user_id', $user->id)
        ->exists();
});

Broadcast::channel('admin.homework-submissions', function (User $user): bool {
    return $user->can('view', HomeworkSubmission::class);
});
