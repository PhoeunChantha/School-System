<?php

namespace Database\Factories;

use App\Models\FeeCharge;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FeeCharge>
 */
class FeeChargeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'level_id' => fn (array $attributes) => Student::find($attributes['student_id'])?->level_id,
            'billing_month' => fake()->unique()->dateTimeBetween('-6 months', 'now')->format('Y-m-01'),
            'academic_year' => now()->format('Y'),
            'due_on' => fake()->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'amount' => fake()->randomFloat(2, 20, 120),
            'discount_amount' => 0,
            'paid_amount' => 0,
            'status' => 'unpaid',
        ];
    }
}
