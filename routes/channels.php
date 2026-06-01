<?php

use App\Models\HomeworkSubmission;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

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
    $allowed = $user->can('view', HomeworkSubmission::class);

    Log::info('Homework submission broadcast channel auth', [
        'user_id' => $user->id,
        'email' => $user->email,
        'allowed' => $allowed,
        'channel' => 'private-admin.homework-submissions',
    ]);

    return $allowed;
});
