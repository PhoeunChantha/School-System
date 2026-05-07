<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreSchoolClassRequest;
use App\Http\Requests\Backends\UpdateSchoolClassRequest;
use App\Models\SchoolClass;
use App\Services\Backends\SchoolClassService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SchoolClassController extends Controller
{
    /**
     * @var SchoolClassService
     */
    public $schoolClassService;

    public function __construct(SchoolClassService $schoolClassService)
    {
        $this->schoolClassService = $schoolClassService;
    }

    public function index(): Response
    {
        return Inertia::render('admin/classes/index', $this->schoolClassService->indexData());
    }

    public function store(StoreSchoolClassRequest $request): RedirectResponse
    {
        try {
            $this->schoolClassService->create($request->validated(), $request->user()?->id);

            return to_route('admin.classes')->with('success', 'Class created successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to create class. Please try again.');
        }
    }

    public function update(UpdateSchoolClassRequest $request, SchoolClass $schoolClass): RedirectResponse
    {
        try {
            $this->schoolClassService->update($schoolClass, $request->validated(), $request->user()?->id);

            return to_route('admin.classes')->with('success', 'Class updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update class. Please try again.');
        }
    }

    public function destroy(Request $request, SchoolClass $schoolClass): RedirectResponse
    {
        try {
            $this->schoolClassService->delete($schoolClass, $request->user()?->id);

            return to_route('admin.classes')->with('success', 'Class deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete class. Please try again.');
        }
    }
}
