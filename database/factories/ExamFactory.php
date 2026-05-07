<?php

namespace Database\Factories;

use App\Models\Exam;
use App\Models\SchoolClass;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Exam>
 */
class ExamFactory extends Factory
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
            'title' => fake()->sentence(3),
            'subject' => fake()->words(2, true),
            'academic_year' => now()->format('Y'),
            'exam_date' => fake()->dateTimeBetween('tomorrow', '+60 days')->format('Y-m-d'),
            'duration_minutes' => fake()->numberBetween(45, 120),
            'content' => ['html' => '<p>'.fake()->sentence().'</p>'],
            'status' => 'draft',
        ];
    }
}
