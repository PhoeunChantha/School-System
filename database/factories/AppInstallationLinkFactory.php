<?php

namespace Database\Factories;

use App\Models\AppInstallationLink;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AppInstallationLink>
 */
class AppInstallationLinkFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $token = Str::random(64);

        return [
            'student_id' => Student::factory(),
            'created_by' => User::factory(),
            'audience' => fake()->randomElement(['student', 'parent']),
            'token' => $token,
            'token_hash' => hash('sha256', $token),
            'expires_at' => now()->addDays(30),
        ];
    }
}
