<?php

namespace Database\Factories;

use App\Models\HomeworkAssignment;
use App\Models\HomeworkSubmission;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HomeworkSubmission>
 */
class HomeworkSubmissionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'homework_assignment_id' => HomeworkAssignment::factory(),
            'student_id' => Student::factory(),
            'submitted_at' => fake()->optional()->dateTimeBetween('-7 days', 'now'),
            'score' => fake()->optional()->numberBetween(0, 100),
            'status' => fake()->randomElement(['pending', 'submitted', 'graded', 'missing']),
            'feedback' => fake()->optional()->sentence(),
        ];
    }
}
