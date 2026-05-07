<?php

namespace Database\Seeders;

use App\Models\Certificate;
use App\Models\GradeRecord;
use App\Models\Student;
use Illuminate\Database\Seeder;

class CertificateSeeder extends Seeder
{
    public function run(): void
    {
        if (Certificate::count() > 0) {
            return;
        }

        $year    = date('Y');
        $certNum = 1;

        // Award top-performing students (average >= 85) a merit/excellence certificate
        $topStudents = GradeRecord::select('student_id')
            ->selectRaw('AVG(average) as avg_score')
            ->groupBy('student_id')
            ->having('avg_score', '>=', 85)
            ->with('student')
            ->get();

        foreach ($topStudents as $record) {
            $student = Student::find($record->student_id);
            if (! $student) {
                continue;
            }

            $isExcellence = $record->avg_score >= 92;

            Certificate::create([
                'student_id'         => $student->id,
                'level_id'           => $student->level_id,
                'type'               => $isExcellence ? 'excellence' : 'merit',
                'title'              => $isExcellence ? 'Academic Excellence Award' : 'Merit Award',
                'academic_year'      => $year,
                'issued_on'          => now()->subDays(rand(5, 30))->format('Y-m-d'),
                'certificate_number' => sprintf('CERT-%s-%04d', $year, $certNum++),
                'status'             => 'issued',
            ]);
        }

        // Completion certificates for all active students (course completion)
        $students = Student::where('status', 'active')->inRandomOrder()->take(15)->get();
        foreach ($students as $student) {
            Certificate::firstOrCreate(
                ['student_id' => $student->id, 'type' => 'completion', 'academic_year' => $year],
                [
                    'level_id'           => $student->level_id,
                    'title'              => 'Course Completion',
                    'issued_on'          => now()->subDays(rand(1, 10))->format('Y-m-d'),
                    'certificate_number' => sprintf('CERT-%s-%04d', $year, $certNum++),
                    'status'             => 'issued',
                ]
            );
        }
    }
}
