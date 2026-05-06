<?php

namespace Database\Factories;

use App\Models\Level;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Level>
 */
class LevelFactory extends Factory
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
                'Beginner 1',
                'Beginner 2',
                'Elementary',
                'Pre-Intermediate',
                'Intermediate',
                'Upper-Intermediate',
                'Advanced',
            ]).' '.fake()->unique()->numberBetween(1, 99),
            'sort_order' => fake()->numberBetween(1, 99),
            'monthly_fee' => fake()->randomFloat(2, 20, 120),
            'is_active' => true,
        ];
    }
}
