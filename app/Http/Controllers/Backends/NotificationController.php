<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreNotificationRequest;
use App\Http\Requests\Backends\UpdateNotificationRequest;
use App\Models\Notification;
use App\Services\Backends\NotificationService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class NotificationController extends Controller
{
    /**
     * @var NotificationService
     */
    public $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function index(): Response
    {
        return Inertia::render('admin/notifications/index', $this->notificationService->indexData());
    }

    public function store(StoreNotificationRequest $request): RedirectResponse
    {
        try {
            $this->notificationService->create($request->validated(), $request->user()?->id);

            return to_route('admin.notifications')->with('success', 'Notification saved successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to save notification. Please try again.');
        }
    }

    public function update(UpdateNotificationRequest $request, Notification $notification): RedirectResponse
    {
        try {
            $this->notificationService->update($notification, $request->validated());

            return to_route('admin.notifications')->with('success', 'Notification updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update notification. Please try again.');
        }
    }

    public function markRead(Notification $notification): RedirectResponse
    {
        try {
            $this->notificationService->markRead($notification);

            return to_route('admin.notifications')->with('success', 'Notification marked as read.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to mark notification as read. Please try again.');
        }
    }

    public function markAllRead(): RedirectResponse
    {
        try {
            $this->notificationService->markAllRead();

            return to_route('admin.notifications')->with('success', 'All notifications marked as read.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to mark notifications as read. Please try again.');
        }
    }

    public function destroy(Notification $notification): RedirectResponse
    {
        try {
            $this->notificationService->delete($notification);

            return to_route('admin.notifications')->with('success', 'Notification deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete notification. Please try again.');
        }
    }
}
