<?php

namespace Database\Seeders;

use App\Models\GradePeriod;
use App\Models\GradeRecord;
use App\Models\Student;
use Illuminate\Database\Seeder;

class GradeSeeder extends Seeder
{
    public function run(): void
    {
        if (GradeRecord::count() > 0) {
            return;
        }

        $periods  = GradePeriod::all();
        $students = Student::all();

        foreach ($periods as $period) {
            foreach ($students as $student) {
                $speaking  = rand(55, 100);
                $listening = rand(55, 100);
                $reading   = rand(55, 100);
                $writing   = rand(55, 100);
                $average   = round(($speaking + $listening + $reading + $writing) / 4, 2);

                GradeRecord::create([
                    'grade_period_id' => $period->id,
                    'student_id'      => $student->id,
                    'school_class_id' => $student->school_class_id,
                    'speaking'        => $speaking,
                    'listening'       => $listening,
                    'reading'         => $reading,
                    'writing'         => $writing,
                    'average'         => $average,
                    'graded_at'       => $period->ends_on,
                ]);
            }
        }
    }
}
