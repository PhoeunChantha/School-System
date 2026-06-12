<?php

namespace Database\Factories;

use App\Models\SmsCommunication;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SmsCommunication>
 */
class SmsCommunicationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'phone' => '855'.fake()->numerify('########'),
            'provider' => 'plasgate',
            'sender' => 'Frania',
            'message' => fake()->sentence(),
            'status' => 'sent',
            'attempt_count' => 1,
            'provider_status' => 200,
            'provider_response' => '{"success":true}',
            'last_attempted_at' => now(),
            'sent_at' => now(),
        ];
    }
}
