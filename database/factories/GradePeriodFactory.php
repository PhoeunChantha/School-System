<?php

namespace Database\Factories;

use App\Models\GradePeriod;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GradePeriod>
 */
class GradePeriodFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->randomElement([
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'Midterm',
                'Final',
            ]).' '.fake()->unique()->numberBetween(1, 99),
            'type' => fake()->randomElement(['monthly', 'term', 'final']),
            'academic_year' => now()->format('Y'),
            'starts_on' => fake()->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
            'ends_on' => fake()->dateTimeBetween('now', '+6 months')->format('Y-m-d'),
            'is_current' => false,
        ];
    }
}
