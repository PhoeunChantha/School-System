<?php

namespace Database\Seeders;

use App\Models\Teacher;
use Illuminate\Database\Seeder;

class TeacherSeeder extends Seeder
{
    public function run(): void
    {
        $teachers = [
            ['name_kh' => 'សុខ ដារ៉ា',     'name_en' => 'Sok Dara',      'subject' => 'English',     'phone' => '0123456781', 'status' => 'active'],
            ['name_kh' => 'ចាន់ ពុទ្ធ',     'name_en' => 'Chan Puth',     'subject' => 'English',     'phone' => '0123456782', 'status' => 'active'],
            ['name_kh' => 'លី ស្រីពេជ្រ',   'name_en' => 'Ly Sreypech',   'subject' => 'English',     'phone' => '0123456783', 'status' => 'active'],
            ['name_kh' => 'ហេង ម៉ករា',      'name_en' => 'Heng Makara',   'subject' => 'Mathematics', 'phone' => '0123456784', 'status' => 'active'],
            ['name_kh' => 'ប៊ូ វណ្ណា',      'name_en' => 'Bou Vanna',     'subject' => 'Khmer',       'phone' => '0123456785', 'status' => 'active'],
            ['name_kh' => 'ហ៊ន ស្រីរ័ត្ន',  'name_en' => 'Hon Sreyrath',  'subject' => 'Science',     'phone' => '0123456786', 'status' => 'active'],
        ];

        foreach ($teachers as $data) {
            Teacher::firstOrCreate(['name_en' => $data['name_en']], $data);
        }
    }
}
