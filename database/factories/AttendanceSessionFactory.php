<?php

namespace Database\Factories;

use App\Models\AttendanceSession;
use App\Models\SchoolClass;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AttendanceSession>
 */
class AttendanceSessionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'school_class_id' => SchoolClass::factory(),
            'attendance_date' => fake()->dateTimeBetween('-30 days')->format('Y-m-d'),
            'period' => fake()->randomElement(['morning', 'afternoon', 'evening']),
            'marked_at' => fake()->dateTimeBetween('-30 days'),
        ];
    }
}
