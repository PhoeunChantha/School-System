<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\HomeworkAssignment;
use App\Models\Notification;
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

    public function examShow(Request $request, Exam $exam): Response
    {
        return Inertia::render('student/exams/show', $this->service->examDetailData($request->user(), $exam));
    }

    public function examResults(Request $request): Response
    {
        return Inertia::render('student/exam-results/index', $this->service->examResultsData($request->user()));
    }

    public function classSchedule(Request $request): Response
    {
        return Inertia::render('student/class-schedule/index', $this->service->classScheduleData($request->user()));
    }

    public function learningMaterials(Request $request): Response
    {
        return Inertia::render('student/learning-materials/index', $this->service->learningMaterialsData($request->user()));
    }

    public function attendanceCalendar(Request $request): Response
    {
        return Inertia::render('student/attendance-calendar/index', $this->service->attendanceCalendarData($request->user()));
    }

    public function homeworkCalendar(Request $request): Response
    {
        return Inertia::render('student/homework-calendar/index', $this->service->homeworkCalendarData($request->user()));
    }

    public function idCard(Request $request): Response
    {
        return Inertia::render('student/id-card/index', $this->service->idCardData($request->user()));
    }

    public function certificates(Request $request): Response
    {
        return Inertia::render('student/certificates/index', $this->service->certificatesData($request->user()));
    }

    public function notifications(Request $request): Response
    {
        return Inertia::render('student/notifications/index', $this->service->notificationsData($request->user()));
    }

    public function notificationShow(Request $request, Notification $notification): Response
    {
        return Inertia::render('student/notifications/show', $this->service->notificationDetailData($request->user(), $notification));
    }

    public function markNotificationsRead(Request $request): RedirectResponse
    {
        $this->service->markNotificationsRead($request->user());

        return back();
    }

    public function profile(Request $request): Response
    {
        return Inertia::render('student/profile/index', $this->service->profileData($request->user()));
    }
}
