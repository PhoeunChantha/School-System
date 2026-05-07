<?php

namespace Database\Factories;

use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExamResult>
 */
class ExamResultFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'exam_id' => Exam::factory(),
            'student_id' => Student::factory(),
            'score' => fake()->randomFloat(2, 0, 100),
            'max_score' => 100,
            'status' => 'pending',
            'note' => fake()->optional()->sentence(),
        ];
    }
}
