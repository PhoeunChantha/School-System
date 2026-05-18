<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        if (ExpenseCategory::count() > 0) {
            return;
        }

        $categories = [
            ['name' => 'Utilities',        'name_kh' => 'អគ្គិសនី និងទឹក',       'color' => '#3b82f6'],
            ['name' => 'Salaries',         'name_kh' => 'បើកប្រាក់ខែ',            'color' => '#10b981'],
            ['name' => 'Office Supplies',  'name_kh' => 'សម្ភារៈការិយាល័យ',      'color' => '#6366f1'],
            ['name' => 'Maintenance',      'name_kh' => 'ថែទាំ និងជួសជុល',       'color' => '#f59e0b'],
            ['name' => 'Transport',        'name_kh' => 'ការដឹកជញ្ជូន',           'color' => '#8b5cf6'],
            ['name' => 'Food & Beverages', 'name_kh' => 'អាហារ និងភេសជ្ជៈ',      'color' => '#ec4899'],
            ['name' => 'Equipment',        'name_kh' => 'ឧបករណ៍',                'color' => '#14b8a6'],
            ['name' => 'Events',           'name_kh' => 'សកម្មភាព និងព្រឹត្តិការណ៍', 'color' => '#ef4444'],
            ['name' => 'Miscellaneous',    'name_kh' => 'ចំណាយផ្សេងៗ',           'color' => '#94a3b8'],
        ];

        foreach ($categories as $category) {
            ExpenseCategory::create($category);
        }
    }
}
