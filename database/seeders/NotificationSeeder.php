<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        if (Notification::count() > 0) {
            return;
        }

        $adminId  = User::first()?->id ?? 1;
        $students = Student::inRandomOrder()->take(5)->get();

        $notifications = [
            // System notifications
            ['category' => 'system',     'severity' => 'info',    'title' => 'System Setup Complete',           'body' => 'The school management system has been configured and is ready to use.'],
            ['category' => 'system',     'severity' => 'info',    'title' => 'New Academic Year Started',       'body' => 'Welcome to the new academic year. All classes have been set up successfully.'],
            ['category' => 'system',     'severity' => 'warning', 'title' => 'Server Maintenance Scheduled',   'body' => 'Maintenance is scheduled for this weekend. Please save your work beforehand.'],
            // Fee notifications
            ['category' => 'fees',       'severity' => 'warning', 'title' => 'Fee Payment Reminder',           'body' => 'Several students have unpaid fees for this month. Please follow up.'],
            ['category' => 'fees',       'severity' => 'urgent',  'title' => 'Overdue Fees Detected',          'body' => 'Some students have fees overdue by more than 30 days.'],
            ['category' => 'fees',       'severity' => 'info',    'title' => 'Monthly Billing Generated',      'body' => 'Fee charges for this month have been generated for all active students.'],
            // Attendance notifications
            ['category' => 'attendance', 'severity' => 'warning', 'title' => 'Low Attendance Alert',           'body' => 'Some students have attendance below 70% this month.'],
            ['category' => 'attendance', 'severity' => 'info',    'title' => 'Attendance Marked',              'body' => 'Attendance has been recorded for all morning sessions today.'],
            // Homework notifications
            ['category' => 'homework',   'severity' => 'info',    'title' => 'Homework Submissions Due',       'body' => 'Homework assignments are due this Friday. Remind students to submit.'],
            ['category' => 'homework',   'severity' => 'warning', 'title' => 'Missing Submissions Detected',  'body' => 'Several students have not submitted this week\'s homework.'],
            ['category' => 'homework',   'severity' => 'info',    'title' => 'Grading Completed',             'body' => 'All homework for the previous week has been graded and scores recorded.'],
        ];

        foreach ($notifications as $n) {
            Notification::create([
                'category'   => $n['category'],
                'title'      => $n['title'],
                'body'       => $n['body'],
                'severity'   => $n['severity'],
                'user_id'    => null,
                'student_id' => null,
                'read_at'    => rand(0, 1) ? now()->subHours(rand(1, 48)) : null,
                'data'       => ['titleKh' => $n['title']],
                'created_by' => $adminId,
            ]);
        }

        // Student-specific notifications
        foreach ($students as $student) {
            Notification::create([
                'category'   => 'fees',
                'title'      => 'Fee Reminder for ' . $student->name_en,
                'body'       => $student->name_en . ' has an outstanding fee balance. Please contact the parent.',
                'severity'   => 'warning',
                'student_id' => $student->id,
                'user_id'    => null,
                'read_at'    => null,
                'data'       => ['titleKh' => 'ការរំលឹកថ្លៃសិក្សា'],
                'created_by' => $adminId,
            ]);
        }
    }
}
