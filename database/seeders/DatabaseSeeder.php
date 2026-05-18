<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::firstOrCreate(
            ['email' => 'admin@frania.edu.kh'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Keep legacy test user
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $this->call([
            PermissionSeeder::class,   // 0 — feature action permissions
            RoleSeeder::class,         // 0.1 — admin, teacher, student roles
            LevelSeeder::class,        // 1 — no dependencies
            TeacherSeeder::class,      // 2 — no dependencies
            SchoolClassSeeder::class,  // 3 — needs levels + teachers
            GradePeriodSeeder::class,  // 4 — no dependencies
            StudentSeeder::class,      // 5 — needs classes + levels
            AttendanceSeeder::class,   // 6 — needs classes + students
            GradeSeeder::class,        // 7 — needs students + grade periods
            FeeSeeder::class,          // 8 — needs students
            HomeworkSeeder::class,     // 9 — needs classes + students
            ExamSeeder::class,         // 10 — needs classes + students
            CertificateSeeder::class,  // 11 — needs students + grade records
            NotificationSeeder::class, // 12 — needs students + users
            SchoolSettingSeeder::class, // 13 — no dependencies
            ActivityLogSeeder::class,  // 14 — needs students + users
            ExpenseCategorySeeder::class, // 15 — no dependencies
            ExpenseSeeder::class,         // 16 — needs expense categories
        ]);
    }
}
