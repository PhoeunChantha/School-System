<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreHomeworkSubmissionRequest;
use App\Http\Requests\Backends\UpdateHomeworkSubmissionRequest;
use App\Models\HomeworkSubmission;
use App\Services\Backends\HomeworkSubmissionService;
use App\Support\HomeworkSubmissionAlerts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class HomeworkSubmissionController extends Controller
{
    /**
     * @var HomeworkSubmissionService
     */
    public $homeworkSubmissionService;

    public function __construct(
        HomeworkSubmissionService $homeworkSubmissionService,
        private readonly HomeworkSubmissionAlerts $homeworkSubmissionAlerts,
    ) {
        $this->homeworkSubmissionService = $homeworkSubmissionService;
    }

    public function index(): Response
    {
        return Inertia::render('admin/homework-submissions/index', $this->homeworkSubmissionService->indexData(request()->user()));
    }

    public function create(): Response
    {
        return Inertia::render('admin/homework-submissions/create', $this->homeworkSubmissionService->createData());
    }

    public function alerts(Request $request): JsonResponse
    {
        $user = $request->user();

        abort_unless($user && $user->can('view', HomeworkSubmission::class), 403);

        $unreadCount = $this->homeworkSubmissionAlerts->unreadCount($user);
        $latest = $this->homeworkSubmissionAlerts->latestUnread($user);

        // Log::info('Homework submission alerts endpoint checked', [
        //     'user_id' => $user->id,
        //     'unread_count' => $unreadCount,
        //     'latest_submission_id' => $latest['id'] ?? null,
        //     'url' => $request->path(),
        // ]);

        return response()->json([
            'unreadCount' => $unreadCount,
            'latest' => $latest,
        ]);
    }

    public function store(StoreHomeworkSubmissionRequest $request): RedirectResponse
    {
        try {
            $this->homeworkSubmissionService->create($request->validated(), $request->user()?->id);

            return to_route('admin.homework-submissions')->with('success', 'Homework submission saved successfully.');
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to save homework submission. Please try again.');
        }
    }

    public function update(UpdateHomeworkSubmissionRequest $request, HomeworkSubmission $homeworkSubmission): RedirectResponse
    {
        try {
            $this->homeworkSubmissionService->update($homeworkSubmission, $request->validated(), $request->user()?->id);

            return to_route('admin.homework-submissions')->with('success', 'Homework submission updated successfully.');
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update homework submission. Please try again.');
        }
    }

    public function destroy(HomeworkSubmission $homeworkSubmission): RedirectResponse
    {
        try {
            $this->homeworkSubmissionService->delete($homeworkSubmission);

            return to_route('admin.homework-submissions')->with('success', 'Homework submission deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete homework submission. Please try again.');
        }
    }
}
