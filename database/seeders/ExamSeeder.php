<?php

namespace Database\Seeders;

use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Database\Seeder;

class ExamSeeder extends Seeder
{
    public function run(): void
    {
        if (Exam::count() > 0) {
            return;
        }

        $year = date('Y');

        $examTemplates = [
            ['title' => 'Monthly Test - January',  'subject' => 'English',     'duration' => 60,  'exam_date' => $year.'-01-20'],
            ['title' => 'Monthly Test - February', 'subject' => 'English',     'duration' => 60,  'exam_date' => $year.'-02-20'],
            ['title' => 'Midterm Exam',             'subject' => 'General',     'duration' => 120, 'exam_date' => $year.'-03-15'],
            ['title' => 'Monthly Test - April',    'subject' => 'English',     'duration' => 60,  'exam_date' => $year.'-04-20'],
        ];

        foreach (SchoolClass::all() as $class) {
            $students = Student::where('school_class_id', $class->id)->get();

            foreach ($examTemplates as $template) {
                $exam = Exam::create([
                    'school_class_id'  => $class->id,
                    'title'            => $template['title'] . ' — ' . $class->name,
                    'subject'          => $template['subject'],
                    'academic_year'    => $year,
                    'exam_date'        => $template['exam_date'],
                    'duration_minutes' => $template['duration'],
                    'content'          => ['html' => '<p>Exam covers all topics from the current month.</p>'],
                    'status'           => 'published',
                ]);

                foreach ($students as $student) {
                    $score = rand(45, 100);

                    ExamResult::create([
                        'exam_id'    => $exam->id,
                        'student_id' => $student->id,
                        'score'      => $score,
                        'max_score'  => 100,
                        'status'     => $score >= 50 ? 'passed' : 'failed',
                        'note'       => null,
                    ]);
                }
            }
        }
    }
}
