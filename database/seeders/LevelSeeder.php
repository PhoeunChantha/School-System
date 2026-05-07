<?php

namespace Database\Seeders;

use App\Models\Level;
use Illuminate\Database\Seeder;

class LevelSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            ['name' => 'Beginner 1',         'sort_order' => 1, 'monthly_fee' => 25.00, 'is_active' => true],
            ['name' => 'Beginner 2',         'sort_order' => 2, 'monthly_fee' => 25.00, 'is_active' => true],
            ['name' => 'Elementary',         'sort_order' => 3, 'monthly_fee' => 30.00, 'is_active' => true],
            ['name' => 'Pre-Intermediate',   'sort_order' => 4, 'monthly_fee' => 35.00, 'is_active' => true],
            ['name' => 'Intermediate',       'sort_order' => 5, 'monthly_fee' => 40.00, 'is_active' => true],
            ['name' => 'Upper-Intermediate', 'sort_order' => 6, 'monthly_fee' => 45.00, 'is_active' => true],
            ['name' => 'Advanced',           'sort_order' => 7, 'monthly_fee' => 50.00, 'is_active' => true],
        ];

        foreach ($levels as $data) {
            Level::firstOrCreate(['name' => $data['name']], $data);
        }
    }
}
