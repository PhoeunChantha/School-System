<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\PushSubscription;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class StudentPushSubscriptionController extends Controller
{
    public function publicKey(): JsonResponse
    {
        return response()->json([
            'publicKey' => config('services.webpush.public_key'),
            'configured' => filled(config('services.webpush.public_key')) && filled(config('services.webpush.private_key')),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => ['required', 'url', 'max:4096'],
            'keys.p256dh' => ['required', 'string', 'max:4096'],
            'keys.auth' => ['required', 'string', 'max:1024'],
        ]);

        $student = $this->studentFor($request);

        PushSubscription::query()->updateOrCreate(
            ['endpoint_hash' => hash('sha256', $validated['endpoint'])],
            [
                'user_id' => $request->user()->id,
                'student_id' => $student?->id,
                'endpoint' => $validated['endpoint'],
                'public_key' => $validated['keys']['p256dh'],
                'auth_token' => $validated['keys']['auth'],
                'content_encoding' => 'aes128gcm',
                'user_agent' => $request->userAgent(),
                'last_used_at' => now(),
            ],
        );

        return response()->json(['subscribed' => true]);
    }

    public function destroy(Request $request): Response
    {
        $validated = $request->validate([
            'endpoint' => ['required', 'url', 'max:4096'],
        ]);

        PushSubscription::query()
            ->where('endpoint', $validated['endpoint'])
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->noContent();
    }

    public function latest(Request $request): JsonResponse
    {
        $student = $this->studentFor($request);

        $notification = Notification::query()
            ->whereNull('read_at')
            ->where(function ($query) use ($request, $student): void {
                if ($student !== null) {
                    $query->where('student_id', $student->id);
                }

                $query->orWhere('user_id', $request->user()->id)
                    ->orWhereNull('student_id');
            })
            ->latest()
            ->first();

        if (! $notification) {
            return response()->json(['notification' => null]);
        }

        return response()->json([
            'notification' => [
                'title' => $notification->title,
                'body' => $notification->body ?? '',
                'url' => route('student.notifications.show', $notification),
                'tag' => 'student-notification-'.$notification->id,
            ],
        ]);
    }

    private function studentFor(Request $request): ?Student
    {
        return Student::query()
            ->where('user_id', $request->user()->id)
            ->first(['id', 'user_id']);
    }
}
