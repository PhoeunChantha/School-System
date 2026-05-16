<?php

namespace App\Services\Backends;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ActivityLogService
{
    /**
     * @return array{logs: mixed, users: mixed, events: mixed, summary: array<string, mixed>}
     */
    public function indexData(): array
    {
        $logs = ActivityLog::query()
            ->with('user:id,name,email')
            ->latest()
            ->get()
            ->map(fn (ActivityLog $activityLog): array => $this->logPayload($activityLog));

        return [
            'logs' => $logs,
            'users' => $this->userOptions(),
            'events' => ActivityLog::query()->distinct()->orderBy('event')->pluck('event')->values(),
            'summary' => [
                'logCount' => $logs->count(),
                'userCount' => $logs->whereNotNull('userId')->unique('userId')->count(),
                'eventCount' => $logs->unique('event')->count(),
                'manualCount' => $logs->where('event', 'manual')->count(),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ActivityLog
    {
        return DB::transaction(fn (): ActivityLog => ActivityLog::create($this->normalizedData($data)));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ActivityLog $activityLog, array $data): ActivityLog
    {
        return DB::transaction(function () use ($activityLog, $data): ActivityLog {
            $activityLog->update($this->normalizedData($data));

            return $activityLog->refresh();
        });
    }

    public function delete(ActivityLog $activityLog): void
    {
        DB::transaction(fn (): ?bool => $activityLog->delete());
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
    private function logPayload(ActivityLog $activityLog): array
    {
        return [
            'id' => $activityLog->id,
            'routeKey' => $activityLog->routeKey(),
            'userId' => $activityLog->user_id,
            'userName' => $activityLog->user?->name ?? '',
            'userEmail' => $activityLog->user?->email ?? '',
            'event' => $activityLog->event,
            'description' => $activityLog->description ?? '',
            'properties' => $activityLog->properties ?? [],
            'ipAddress' => $activityLog->ip_address ?? '',
            'userAgent' => $activityLog->user_agent ?? '',
            'createdAt' => $activityLog->created_at?->format('Y-m-d H:i') ?? '',
            'time' => $activityLog->created_at?->diffForHumans() ?? '',
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizedData(array $data): array
    {
        return [
            'user_id' => $data['user_id'] ?? null,
            'event' => $data['event'],
            'description' => $data['description'] ?? null,
            'properties' => $data['properties'] ?? [],
            'ip_address' => $data['ip_address'] ?? null,
            'user_agent' => $data['user_agent'] ?? null,
        ];
    }
}
