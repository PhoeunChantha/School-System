<?php

namespace Database\Seeders;

use App\Models\GradePeriod;
use Illuminate\Database\Seeder;

class GradePeriodSeeder extends Seeder
{
    public function run(): void
    {
        $year = date('Y');

        $periods = [
            ['name' => 'January '   . $year, 'type' => 'monthly', 'academic_year' => $year, 'starts_on' => $year.'-01-01', 'ends_on' => $year.'-01-31', 'is_current' => false],
            ['name' => 'February '  . $year, 'type' => 'monthly', 'academic_year' => $year, 'starts_on' => $year.'-02-01', 'ends_on' => $year.'-02-28', 'is_current' => false],
            ['name' => 'March '     . $year, 'type' => 'monthly', 'academic_year' => $year, 'starts_on' => $year.'-03-01', 'ends_on' => $year.'-03-31', 'is_current' => false],
            ['name' => 'April '     . $year, 'type' => 'monthly', 'academic_year' => $year, 'starts_on' => $year.'-04-01', 'ends_on' => $year.'-04-30', 'is_current' => false],
            ['name' => 'Midterm '   . $year, 'type' => 'term',    'academic_year' => $year, 'starts_on' => $year.'-01-01', 'ends_on' => $year.'-06-30', 'is_current' => false],
            ['name' => 'May '       . $year, 'type' => 'monthly', 'academic_year' => $year, 'starts_on' => $year.'-05-01', 'ends_on' => $year.'-05-31', 'is_current' => true],
        ];

        foreach ($periods as $data) {
            GradePeriod::firstOrCreate(['name' => $data['name']], $data);
        }
    }
}
