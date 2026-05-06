<?php

namespace Database\Factories;

use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Teacher>
 */
class TeacherFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name_kh' => fake()->name(),
            'name_en' => fake()->name(),
            'subject' => fake()->randomElement(['English', 'Khmer', 'Mathematics', 'Science']),
            'phone' => fake()->numerify('0#########'),
            'telegram_username' => fake()->optional()->userName(),
            'status' => 'active',
        ];
    }
}
