<?php

namespace Database\Factories;

use App\Models\Level;
use App\Models\SchoolClass;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SchoolClass>
 */
class SchoolClassFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'level_id' => Level::factory(),
            'teacher_id' => Teacher::factory(),
            'name' => fake()->unique()->bothify('Class ##'),
            'room' => fake()->unique()->bothify('R##'),
            'starts_at' => fake()->time('H:i:s'),
            'ends_at' => fake()->time('H:i:s'),
            'days' => fake()->randomElements(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], 3),
            'capacity' => fake()->numberBetween(12, 35),
            'academic_year' => now()->format('Y'),
            'status' => 'active',
        ];
    }
}
