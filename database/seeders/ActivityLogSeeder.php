<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

class ActivityLogSeeder extends Seeder
{
    public function run(): void
    {
        if (ActivityLog::count() > 0) {
            return;
        }

        $adminId  = User::first()?->id ?? 1;
        $students = Student::inRandomOrder()->take(10)->get();

        $logs = [
            ['event' => 'login',   'description' => 'Admin logged into the system',                   'subject_type' => null,            'subject_id' => null],
            ['event' => 'created', 'description' => 'Created new academic year settings',              'subject_type' => 'SchoolSetting', 'subject_id' => 1],
            ['event' => 'created', 'description' => 'Added 7 new course levels',                      'subject_type' => 'Level',         'subject_id' => 1],
            ['event' => 'created', 'description' => 'Registered 6 new teachers',                      'subject_type' => 'Teacher',       'subject_id' => 1],
            ['event' => 'created', 'description' => 'Created 8 class schedules for the new semester', 'subject_type' => 'SchoolClass',   'subject_id' => 1],
            ['event' => 'created', 'description' => 'Generated monthly fee charges for all students', 'subject_type' => 'FeeCharge',     'subject_id' => 1],
            ['event' => 'created', 'description' => 'Set up grade periods for the academic year',     'subject_type' => 'GradePeriod',   'subject_id' => 1],
            ['event' => 'updated', 'description' => 'Updated school profile settings',                'subject_type' => 'SchoolSetting', 'subject_id' => 1],
            ['event' => 'created', 'description' => 'Published midterm exam for all classes',         'subject_type' => 'Exam',          'subject_id' => 1],
            ['event' => 'updated', 'description' => 'Marked attendance for all morning sessions',     'subject_type' => 'AttendanceSession', 'subject_id' => 1],
        ];

        foreach ($logs as $i => $log) {
            ActivityLog::create([
                'user_id'      => $adminId,
                'event'        => $log['event'],
                'subject_type' => $log['subject_type'],
                'subject_id'   => $log['subject_id'],
                'description'  => $log['description'],
                'properties'   => ['source' => 'seeder'],
                'ip_address'   => '127.0.0.1',
                'user_agent'   => 'Mozilla/5.0 (seeder)',
                'created_at'   => now()->subDays(30 - $i),
            ]);
        }

        // Per-student enrollment logs
        foreach ($students as $student) {
            ActivityLog::create([
                'user_id'      => $adminId,
                'event'        => 'created',
                'subject_type' => 'Student',
                'subject_id'   => $student->id,
                'description'  => "Enrolled student: {$student->name_en}",
                'properties'   => ['source' => 'seeder', 'student_code' => $student->code],
                'ip_address'   => '127.0.0.1',
                'user_agent'   => 'Mozilla/5.0 (seeder)',
            ]);
        }
    }
}
