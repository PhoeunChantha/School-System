<?php

namespace App\Services\Backends;

use App\Models\Notification;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    /**
     * @return array{notifications: mixed, students: mixed, users: mixed, summary: array<string, mixed>}
     */
    public function indexData(): array
    {
        $notifications = Notification::query()
            ->with([
                'student:id,name_kh,name_en',
                'user:id,name,email',
            ])
            ->latest()
            ->get()
            ->map(fn (Notification $notification): array => $this->notificationPayload($notification));

        return [
            'notifications' => $notifications,
            'students' => $this->studentOptions(),
            'users' => $this->userOptions(),
            'summary' => [
                'notificationCount' => $notifications->count(),
                'unreadCount' => $notifications->where('read', false)->count(),
                'urgentCount' => $notifications->where('severity', 'urgent')->count(),
                'readCount' => $notifications->where('read', true)->count(),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): Notification
    {
        return DB::transaction(fn (): Notification => Notification::create([
            ...$this->normalizedData($data),
            'created_by' => $userId,
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Notification $notification, array $data): Notification
    {
        return DB::transaction(function () use ($notification, $data): Notification {
            $notification->update($this->normalizedData($data));

            return $notification->refresh();
        });
    }

    public function markRead(Notification $notification): Notification
    {
        return DB::transaction(function () use ($notification): Notification {
            $notification->update(['read_at' => now()]);

            return $notification->refresh();
        });
    }

    public function markAllRead(): void
    {
        DB::transaction(fn (): int => Notification::query()
            ->whereNull('read_at')
            ->update(['read_at' => now()]));
    }

    public function delete(Notification $notification): void
    {
        DB::transaction(fn (): ?bool => $notification->delete());
    }

    /**
     * @return mixed
     */
    private function studentOptions()
    {
        return Student::query()
            ->active()
            ->orderBy('name_en')
            ->get(['id', 'name_kh', 'name_en'])
            ->map(fn (Student $student): array => [
                'id' => $student->id,
                'routeKey' => $student->routeKey(),
                'nameKh' => $student->name_kh,
                'nameEn' => $student->name_en,
            ]);
    }

    /**
     * @return mixed
     */
    private function userOptions()
    {
        return User::query()
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'routeKey' => $user->routeKey(),
                'name' => $user->name,
                'email' => $user->email,
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function notificationPayload(Notification $notification): array
    {
        $data = is_array($notification->data) ? $notification->data : [];

        return [
            'id' => $notification->id,
            'routeKey' => $notification->routeKey(),
            'category' => $notification->category,
            'titleKh' => $data['titleKh'] ?? '',
            'title' => $notification->title,
            'body' => $notification->body ?? '',
            'severity' => $notification->severity,
            'studentId' => $notification->student_id,
            'studentName' => $notification->student?->name_en ?? '',
            'userId' => $notification->user_id,
            'userName' => $notification->user?->name ?? '',
            'read' => $notification->read_at !== null,
            'time' => $notification->created_at?->diffForHumans() ?? '',
            'createdAt' => $notification->created_at?->format('Y-m-d H:i') ?? '',
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizedData(array $data): array
    {
        return [
            'category' => $data['category'],
            'title' => $data['title'],
            'body' => $data['body'] ?? null,
            'severity' => $data['severity'],
            'student_id' => $data['student_id'] ?? null,
            'user_id' => $data['user_id'] ?? null,
            'read_at' => $data['is_read'] ? now() : null,
            'data' => [
                'titleKh' => $data['title_kh'] ?? '',
            ],
        ];
    }
}
