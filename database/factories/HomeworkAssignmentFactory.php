<?php

namespace Database\Factories;

use App\Models\HomeworkAssignment;
use App\Models\SchoolClass;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HomeworkAssignment>
 */
class HomeworkAssignmentFactory extends Factory
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
            'title_kh' => fake()->sentence(3),
            'title_en' => fake()->sentence(3),
            'instructions' => fake()->optional()->paragraph(),
            'points' => fake()->numberBetween(10, 100),
            'due_on' => fake()->dateTimeBetween('tomorrow', '+30 days')->format('Y-m-d'),
            'academic_year' => now()->format('Y'),
            'status' => 'assigned',
        ];
    }
}
