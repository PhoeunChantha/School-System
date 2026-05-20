<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\HomeworkAssignment;
use App\Services\Student\StudentPortalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentPortalController extends Controller
{
    public function __construct(private StudentPortalService $service) {}

    public function dashboard(Request $request): Response
    {
        return Inertia::render('student/dashboard/index', $this->service->dashboardData($request->user()));
    }

    public function attendance(Request $request): Response
    {
        return Inertia::render('student/attendance/index', $this->service->attendanceData($request->user()));
    }

    public function grades(Request $request): Response
    {
        return Inertia::render('student/grades/index', $this->service->gradesData($request->user()));
    }

    public function homework(Request $request): Response
    {
        return Inertia::render('student/homework/index', $this->service->homeworkData($request->user()));
    }

    public function submitHomework(Request $request, HomeworkAssignment $homeworkAssignment): RedirectResponse
    {
        $validated = $request->validate([
            'note' => ['nullable', 'string', 'max:5000'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'],
        ]);

        $this->service->submitHomework($request->user(), $homeworkAssignment, $validated);

        return back()->with('success', 'Homework submitted.');
    }

    public function fees(Request $request): Response
    {
        return Inertia::render('student/fees/index', $this->service->feesData($request->user()));
    }

    public function exams(Request $request): Response
    {
        return Inertia::render('student/exams/index', $this->service->examsData($request->user()));
    }

    public function notifications(Request $request): Response
    {
        return Inertia::render('student/notifications/index', $this->service->notificationsData($request->user()));
    }

    public function profile(Request $request): Response
    {
        return Inertia::render('student/profile/index', $this->service->profileData($request->user()));
    }
}
