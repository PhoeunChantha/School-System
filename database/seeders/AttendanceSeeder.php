<?php

namespace Database\Seeders;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Database\Seeder;

class AttendanceSeeder extends Seeder
{
    public function run(): void
    {
        if (AttendanceSession::count() > 0) {
            return;
        }

        $statuses = ['present', 'present', 'present', 'present', 'late', 'absent', 'excused'];
        $classes  = SchoolClass::with('students')->get();

        foreach ($classes as $class) {
            $students = Student::where('school_class_id', $class->id)->get();

            if ($students->isEmpty()) {
                continue;
            }

            // Create 10 sessions over the past 14 days for each class
            for ($day = 14; $day >= 5; $day--) {
                $date = now()->subDays($day)->format('Y-m-d');

                $session = AttendanceSession::create([
                    'school_class_id' => $class->id,
                    'attendance_date' => $date,
                    'period'          => 'morning',
                    'marked_at'       => now()->subDays($day),
                ]);

                foreach ($students as $student) {
                    AttendanceRecord::create([
                        'attendance_session_id' => $session->id,
                        'student_id'            => $student->id,
                        'status'                => $statuses[array_rand($statuses)],
                        'note'                  => null,
                    ]);
                }
            }
        }
    }
}
