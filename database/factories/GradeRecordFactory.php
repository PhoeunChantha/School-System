<?php

namespace Database\Factories;

use App\Models\GradePeriod;
use App\Models\GradeRecord;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GradeRecord>
 */
class GradeRecordFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $scores = [
            'speaking' => fake()->numberBetween(50, 100),
            'listening' => fake()->numberBetween(50, 100),
            'reading' => fake()->numberBetween(50, 100),
            'writing' => fake()->numberBetween(50, 100),
        ];

        return [
            'grade_period_id' => GradePeriod::factory(),
            'student_id' => Student::factory(),
            'school_class_id' => fn (array $attributes) => Student::find($attributes['student_id'])?->school_class_id,
            ...$scores,
            'average' => round(array_sum($scores) / count($scores), 2),
            'graded_at' => now(),
        ];
    }
}
