<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Services\Parent\ParentPortalService;
use App\Support\ParentAccessSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParentPortalController extends Controller
{
    public function __construct(
        private readonly ParentPortalService $parentPortalService,
        private readonly ParentAccessSettings $parentAccessSettings,
    ) {}

    public function developerAccess(Request $request, ?Student $student = null): RedirectResponse
    {
        abort_unless(app()->environment(['local', 'testing']), 404);

        $student ??= $this->developerStudentFromPhone($request);
        $student ??= Student::query()
            ->whereNotNull('parent_phone')
            ->orderBy('id')
            ->first();

        abort_if(
            ! $student instanceof Student || ! is_string($student->parent_phone) || $student->parent_phone === '',
            404,
            'No student with a parent phone is available for developer access.',
        );

        $request->session()->put(
            'parent_access_phone',
            $this->parentAccessSettings->normalizePhone($student->parent_phone),
        );

        return to_route('parent.dashboard');
    }

    public function dashboard(Request $request): Response|RedirectResponse
    {
        $phone = $this->parentPhone($request);

        if ($phone === null) {
            return $this->missingParentSession();
        }

        return Inertia::render('parent/dashboard/index', $this->parentPortalService->dashboardData($phone));
    }

    public function attendance(Request $request): Response|RedirectResponse
    {
        $phone = $this->parentPhone($request);

        if ($phone === null) {
            return $this->missingParentSession();
        }

        return Inertia::render('parent/attendance/index', $this->parentPortalService->attendanceData($phone));
    }

    public function grades(Request $request): Response|RedirectResponse
    {
        $phone = $this->parentPhone($request);

        if ($phone === null) {
            return $this->missingParentSession();
        }

        return Inertia::render('parent/grades/index', $this->parentPortalService->gradesData($phone));
    }

    public function homework(Request $request): Response|RedirectResponse
    {
        $phone = $this->parentPhone($request);

        if ($phone === null) {
            return $this->missingParentSession();
        }

        return Inertia::render('parent/homework/index', $this->parentPortalService->homeworkData($phone));
    }

    private function parentPhone(Request $request): ?string
    {
        $phone = $request->session()->get('parent_access_phone');

        if (! is_string($phone) || $phone === '') {
            return null;
        }

        return $phone;
    }

    private function developerStudentFromPhone(Request $request): ?Student
    {
        $phone = $request->string('phone')->toString();

        if ($phone === '') {
            return null;
        }

        $normalizedPhone = $this->parentAccessSettings->normalizePhone($phone);

        return Student::query()
            ->whereNotNull('parent_phone')
            ->get()
            ->first(fn (Student $student): bool => $this->parentAccessSettings->normalizePhone((string) $student->parent_phone) === $normalizedPhone);
    }

    private function missingParentSession(): RedirectResponse
    {
        return to_route('login')->with('status', 'Please request a parent access SMS link.');
    }
}
