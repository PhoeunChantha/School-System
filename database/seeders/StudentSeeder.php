<?php

namespace Database\Seeders;

use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    private const KHMER_FIRST = ['សុខ', 'ចាន់', 'លី', 'ហេង', 'ប៊ូ', 'ហ៊ន', 'វុទ្ធ', 'ពេជ្រ', 'ស្រីណាត', 'ម៉ករា'];
    private const KHMER_LAST  = ['ដារ៉ា', 'ពុទ្ធ', 'ស្រីពេជ្រ', 'វណ្ណា', 'ស្រីរ័ត្ន', 'ចំរើន', 'ពិសិដ្ឋ', 'ឧត្តម', 'ណារ', 'ប៊ុនធឿន'];
    private const EN_FIRST    = ['Dara', 'Puth', 'Sreypech', 'Makara', 'Vanna', 'Sreyrath', 'Vuthy', 'Piseth', 'Narith', 'Bunthoeun', 'Chanthy', 'Sophea', 'Ratana', 'Sovannak', 'Kunthea'];
    private const EN_LAST     = ['Sok', 'Chan', 'Ly', 'Heng', 'Bou', 'Hon', 'Keo', 'Nget', 'Prak', 'Ros', 'Lim', 'Oum', 'Chhay', 'Mao', 'Khon'];
    private const PROVINCES   = ['Phnom Penh', 'Siem Reap', 'Battambang', 'Kampong Cham', 'Takeo', 'Kandal', 'Prey Veng'];

    public function run(): void
    {
        if (Student::count() > 0) {
            return;
        }

        $classes = SchoolClass::with('level')->get();
        $counter = 1;

        foreach ($classes as $class) {
            for ($i = 0; $i < 5; $i++) {
                $firstName = self::EN_FIRST[array_rand(self::EN_FIRST)];
                $lastName  = self::EN_LAST[array_rand(self::EN_LAST)];
                $khFirst   = self::KHMER_FIRST[array_rand(self::KHMER_FIRST)];
                $khLast    = self::KHMER_LAST[array_rand(self::KHMER_LAST)];

                Student::create([
                    'school_class_id'    => $class->id,
                    'level_id'           => $class->level_id,
                    'code'               => sprintf('STU-%04d', $counter++),
                    'name_kh'            => $khFirst . ' ' . $khLast,
                    'name_en'            => $firstName . ' ' . $lastName,
                    'date_of_birth'      => now()->subYears(rand(8, 18))->subDays(rand(0, 365))->format('Y-m-d'),
                    'gender'             => rand(0, 1) ? 'male' : 'female',
                    'province'           => self::PROVINCES[array_rand(self::PROVINCES)],
                    'parent_phone'       => '0' . rand(10, 99) . rand(1000000, 9999999),
                    'monthly_fee'        => $class->level->monthly_fee,
                    'scholarship_amount' => 0,
                    'fee_status'         => 'unpaid',
                    'status'             => 'active',
                    'enrolled_on'        => now()->subMonths(rand(1, 12))->format('Y-m-d'),
                ]);
            }
        }
    }
}
