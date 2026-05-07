<?php

namespace Database\Seeders;

use App\Models\HomeworkAssignment;
use App\Models\HomeworkSubmission;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Database\Seeder;

class HomeworkSeeder extends Seeder
{
    public function run(): void
    {
        if (HomeworkAssignment::count() > 0) {
            return;
        }

        $year    = date('Y');
        $titles  = [
            ['kh' => 'ការអានសៀវភៅ',           'en' => 'Reading Exercise Chapter 1'],
            ['kh' => 'ការសរសេរអត្ថបទ',         'en' => 'Writing Assignment - My Family'],
            ['kh' => 'ការស្តាប់នឹងនិយាយ',      'en' => 'Listening & Speaking Practice'],
            ['kh' => 'វេយ្យាករណ៍',             'en' => 'Grammar Worksheet'],
            ['kh' => 'ការសរសេរពាក្យ',          'en' => 'Vocabulary Building Exercise'],
            ['kh' => 'ការនិទានរឿង',            'en' => 'Storytelling Assignment'],
        ];

        $submissionStatuses = ['submitted', 'submitted', 'graded', 'pending', 'missing'];

        foreach (SchoolClass::all() as $class) {
            $students = Student::where('school_class_id', $class->id)->get();
            $classTitles = array_slice($titles, 0, 3);

            foreach ($classTitles as $i => $title) {
                $dueDate = now()->subDays(($i + 1) * 7)->format('Y-m-d');
                $isPast  = true;

                $assignment = HomeworkAssignment::create([
                    'school_class_id' => $class->id,
                    'title_kh'        => $title['kh'],
                    'title_en'        => $title['en'],
                    'instructions'    => 'Complete the assigned exercises and submit on time.',
                    'points'          => rand(10, 50) * 2,
                    'due_on'          => $dueDate,
                    'academic_year'   => $year,
                    'status'          => $isPast ? 'assigned' : 'assigned',
                ]);

                foreach ($students as $student) {
                    $status = $submissionStatuses[array_rand($submissionStatuses)];
                    $score  = in_array($status, ['graded', 'submitted']) ? rand(60, $assignment->points) : null;

                    HomeworkSubmission::create([
                        'homework_assignment_id' => $assignment->id,
                        'student_id'             => $student->id,
                        'submitted_at'           => $status !== 'missing' && $status !== 'pending'
                            ? now()->subDays(rand(1, 6))->toDateTimeString()
                            : null,
                        'score'                  => $score,
                        'status'                 => $status,
                        'feedback'               => $status === 'graded' ? 'Good effort! Keep it up.' : null,
                    ]);
                }
            }
        }
    }
}
