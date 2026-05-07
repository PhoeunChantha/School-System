<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category' => fake()->randomElement(['attendance', 'fees', 'homework', 'system']),
            'title' => fake()->sentence(3),
            'body' => fake()->paragraph(),
            'severity' => fake()->randomElement(['info', 'warning', 'urgent']),
            'user_id' => null,
            'student_id' => null,
            'read_at' => null,
            'data' => ['titleKh' => fake()->words(2, true)],
            'created_by' => User::factory(),
        ];
    }

    public function read(): static
    {
        return $this->state(fn (): array => [
            'read_at' => now(),
        ]);
    }
}
