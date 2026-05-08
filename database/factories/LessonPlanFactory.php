<?php

namespace Database\Factories;

use App\Models\LessonPlan;
use App\Models\SchoolClass;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LessonPlan>
 */
class LessonPlanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'teacher_id' => Teacher::factory(),
            'school_class_id' => SchoolClass::factory(),
            'lesson_date' => fake()->dateTimeBetween('-1 week', '+2 weeks')->format('Y-m-d'),
            'title' => fake()->sentence(4),
            'objective' => fake()->sentence(12),
            'content' => fake()->paragraph(),
            'materials' => fake()->words(4, true),
            'homework' => fake()->sentence(8),
            'status' => 'planned',
        ];
    }
}
