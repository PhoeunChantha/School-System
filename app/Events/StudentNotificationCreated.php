<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StudentNotificationCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Notification $notification,
        public int $unreadNotifications,
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('students.'.$this->notification->student_id)];
    }

    public function broadcastAs(): string
    {
        return 'student.notification.created';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'notification' => [
                'id' => $this->notification->id,
                'category' => $this->notification->category ?? 'general',
                'title' => $this->notification->title,
                'body' => $this->notification->body,
                'severity' => $this->notification->severity ?? 'info',
                'read' => $this->notification->read_at !== null,
                'createdAt' => $this->notification->created_at?->format('Y-m-d H:i') ?? '',
            ],
            'unreadNotifications' => $this->unreadNotifications,
        ];
    }
}
