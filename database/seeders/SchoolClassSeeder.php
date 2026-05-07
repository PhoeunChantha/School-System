<?php

namespace Database\Seeders;

use App\Models\Level;
use App\Models\SchoolClass;
use App\Models\Teacher;
use Illuminate\Database\Seeder;

class SchoolClassSeeder extends Seeder
{
    public function run(): void
    {
        $year = date('Y');

        $teachers = Teacher::pluck('id', 'name_en');
        $levels   = Level::pluck('id', 'name');

        $classes = [
            [
                'name' => 'Beginner 1A',        'level' => 'Beginner 1',       'teacher' => 'Sok Dara',
                'room' => 'R01', 'starts_at' => '07:00', 'ends_at' => '09:00', 'days' => ['mon', 'wed', 'fri'],
                'capacity' => 20,
            ],
            [
                'name' => 'Beginner 1B',        'level' => 'Beginner 1',       'teacher' => 'Chan Puth',
                'room' => 'R02', 'starts_at' => '17:00', 'ends_at' => '19:00', 'days' => ['tue', 'thu', 'sat'],
                'capacity' => 20,
            ],
            [
                'name' => 'Beginner 2A',        'level' => 'Beginner 2',       'teacher' => 'Ly Sreypech',
                'room' => 'R03', 'starts_at' => '07:00', 'ends_at' => '09:00', 'days' => ['mon', 'wed', 'fri'],
                'capacity' => 20,
            ],
            [
                'name' => 'Elementary A',       'level' => 'Elementary',        'teacher' => 'Sok Dara',
                'room' => 'R04', 'starts_at' => '14:00', 'ends_at' => '16:00', 'days' => ['mon', 'wed', 'fri'],
                'capacity' => 18,
            ],
            [
                'name' => 'Pre-Intermediate A', 'level' => 'Pre-Intermediate',  'teacher' => 'Chan Puth',
                'room' => 'R05', 'starts_at' => '09:00', 'ends_at' => '11:00', 'days' => ['tue', 'thu', 'sat'],
                'capacity' => 18,
            ],
            [
                'name' => 'Intermediate A',     'level' => 'Intermediate',      'teacher' => 'Ly Sreypech',
                'room' => 'R06', 'starts_at' => '07:00', 'ends_at' => '09:00', 'days' => ['mon', 'wed', 'fri'],
                'capacity' => 15,
            ],
            [
                'name' => 'Intermediate B',     'level' => 'Intermediate',      'teacher' => 'Heng Makara',
                'room' => 'R07', 'starts_at' => '17:00', 'ends_at' => '19:00', 'days' => ['tue', 'thu', 'sat'],
                'capacity' => 15,
            ],
            [
                'name' => 'Advanced A',         'level' => 'Advanced',          'teacher' => 'Bou Vanna',
                'room' => 'R08', 'starts_at' => '17:00', 'ends_at' => '19:30', 'days' => ['mon', 'wed', 'fri'],
                'capacity' => 12,
            ],
        ];

        foreach ($classes as $data) {
            SchoolClass::firstOrCreate(
                ['name' => $data['name']],
                [
                    'level_id'      => $levels[$data['level']],
                    'teacher_id'    => $teachers[$data['teacher']],
                    'name'          => $data['name'],
                    'room'          => $data['room'],
                    'starts_at'     => $data['starts_at'],
                    'ends_at'       => $data['ends_at'],
                    'days'          => $data['days'],
                    'capacity'      => $data['capacity'],
                    'academic_year' => $year,
                    'status'        => 'active',
                ]
            );
        }
    }
}
