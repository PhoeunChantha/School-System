<?php

namespace Database\Seeders;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseSeeder extends Seeder
{
    public function run(): void
    {
        if (Expense::count() > 0) {
            return;
        }

        $categories = ExpenseCategory::all()->keyBy('name');

        $year = date('Y');

        $expenses = [
            // Utilities
            ['category' => 'Utilities', 'title' => 'Monthly Electricity Bill',    'amount' => 185.00, 'months_ago' => 0],
            ['category' => 'Utilities', 'title' => 'Monthly Water Bill',          'amount' =>  32.50, 'months_ago' => 0],
            ['category' => 'Utilities', 'title' => 'Internet Service',            'amount' =>  45.00, 'months_ago' => 0],
            ['category' => 'Utilities', 'title' => 'Monthly Electricity Bill',    'amount' => 172.00, 'months_ago' => 1],
            ['category' => 'Utilities', 'title' => 'Monthly Water Bill',          'amount' =>  30.00, 'months_ago' => 1],
            ['category' => 'Utilities', 'title' => 'Internet Service',            'amount' =>  45.00, 'months_ago' => 1],

            // Salaries
            ['category' => 'Salaries', 'title' => 'Teacher Salaries – '.date('F', mktime(0,0,0,date('n'),1)),     'amount' => 3200.00, 'months_ago' => 0],
            ['category' => 'Salaries', 'title' => 'Staff Salaries – '.date('F', mktime(0,0,0,date('n'),1)),       'amount' =>  980.00, 'months_ago' => 0],
            ['category' => 'Salaries', 'title' => 'Teacher Salaries – '.date('F', mktime(0,0,0,date('n')-1,1)),   'amount' => 3200.00, 'months_ago' => 1],
            ['category' => 'Salaries', 'title' => 'Staff Salaries – '.date('F', mktime(0,0,0,date('n')-1,1)),     'amount' =>  980.00, 'months_ago' => 1],

            // Office Supplies
            ['category' => 'Office Supplies', 'title' => 'Printer Paper (10 reams)',  'amount' =>  28.00, 'months_ago' => 0],
            ['category' => 'Office Supplies', 'title' => 'Pens & Stationery',         'amount' =>  15.50, 'months_ago' => 0],
            ['category' => 'Office Supplies', 'title' => 'Whiteboard Markers',        'amount' =>  12.00, 'months_ago' => 1],
            ['category' => 'Office Supplies', 'title' => 'Printer Ink Cartridges',    'amount' =>  64.00, 'months_ago' => 2],

            // Maintenance
            ['category' => 'Maintenance', 'title' => 'Classroom Air-Con Service',     'amount' => 120.00, 'months_ago' => 1],
            ['category' => 'Maintenance', 'title' => 'Toilet Plumbing Repair',        'amount' =>  55.00, 'months_ago' => 2],
            ['category' => 'Maintenance', 'title' => 'Roof Leak Repair',              'amount' => 240.00, 'months_ago' => 3],
            ['category' => 'Maintenance', 'title' => 'Painting – Classroom Block A',  'amount' => 380.00, 'months_ago' => 4],

            // Transport
            ['category' => 'Transport', 'title' => 'Field Trip – National Museum',    'amount' =>  95.00, 'months_ago' => 1],
            ['category' => 'Transport', 'title' => 'Staff Training Transport',        'amount' =>  40.00, 'months_ago' => 2],

            // Food & Beverages
            ['category' => 'Food & Beverages', 'title' => 'Monthly Staff Meeting Snacks',  'amount' =>  22.00, 'months_ago' => 0],
            ['category' => 'Food & Beverages', 'title' => 'Teacher Appreciation Day Lunch','amount' =>  88.00, 'months_ago' => 2],
            ['category' => 'Food & Beverages', 'title' => 'Parent Meeting Refreshments',   'amount' =>  35.00, 'months_ago' => 3],

            // Equipment
            ['category' => 'Equipment', 'title' => 'Projector Replacement',           'amount' => 420.00, 'months_ago' => 3],
            ['category' => 'Equipment', 'title' => 'Student Desks (5 units)',         'amount' => 175.00, 'months_ago' => 4],
            ['category' => 'Equipment', 'title' => 'Whiteboard (2 units)',            'amount' =>  80.00, 'months_ago' => 2],

            // Events
            ['category' => 'Events', 'title' => 'Khmer New Year Celebration',         'amount' => 310.00, 'months_ago' => 1],
            ['category' => 'Events', 'title' => 'Sports Day Prizes',                  'amount' => 125.00, 'months_ago' => 3],
            ['category' => 'Events', 'title' => 'Year-End Ceremony Decoration',       'amount' => 195.00, 'months_ago' => 4],

            // Miscellaneous
            ['category' => 'Miscellaneous', 'title' => 'Bank Transfer Fees',          'amount' =>   8.50, 'months_ago' => 0],
            ['category' => 'Miscellaneous', 'title' => 'Postage & Courier',           'amount' =>  14.00, 'months_ago' => 1],
            ['category' => 'Miscellaneous', 'title' => 'Photocopying – Exams',        'amount' =>  18.00, 'months_ago' => 2],
        ];

        foreach ($expenses as $data) {
            $category = $categories->get($data['category']);
            $date = now()->subMonths($data['months_ago'])->startOfMonth()->addDays(rand(0, 25));

            Expense::create([
                'category_id'  => $category?->id,
                'title'        => $data['title'],
                'amount'       => $data['amount'],
                'expense_date' => $date->toDateString(),
                'description'  => null,
            ]);
        }
    }
}
