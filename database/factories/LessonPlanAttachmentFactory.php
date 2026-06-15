<?php

namespace Database\Factories;

use App\Models\LessonPlan;
use App\Models\LessonPlanAttachment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LessonPlanAttachment>
 */
class LessonPlanAttachmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'lesson_plan_id' => LessonPlan::factory(),
            'original_name' => fake()->word().'.pdf',
            'path' => 'uploads/lesson-plans/'.fake()->uuid().'.pdf',
            'mime_type' => 'application/pdf',
            'size' => fake()->numberBetween(10_000, 2_000_000),
            'sort_order' => 0,
        ];
    }
}
