<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreLevelRequest;
use App\Http\Requests\Backends\UpdateLevelRequest;
use App\Models\Level;
use App\Services\Backends\LevelService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class LevelController extends Controller
{
    public function __construct(private LevelService $levelService) {}

    public function index(): Response
    {
        return Inertia::render('admin/levels/index', $this->levelService->indexData());
    }

    public function store(StoreLevelRequest $request): RedirectResponse
    {
        try {
            $this->levelService->create($request->validated(), $request->user()?->id);

            return back()->with('success', 'Level created successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to create level. Please try again.');
        }
    }

    public function update(UpdateLevelRequest $request, Level $level): RedirectResponse
    {
        try {
            $this->levelService->update($level, $request->validated(), $request->user()?->id);

            return back()->with('success', 'Level updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update level. Please try again.');
        }
    }

    public function destroy(Request $request, Level $level): RedirectResponse
    {
        try {
            $this->levelService->delete($level, $request->user()?->id);

            return back()->with('success', 'Level deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete level. Please try again.');
        }
    }
}
