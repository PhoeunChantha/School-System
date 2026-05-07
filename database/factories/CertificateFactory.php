<?php

namespace Database\Factories;

use App\Models\Certificate;
use App\Models\Level;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Certificate>
 */
class CertificateFactory extends Factory
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
            'level_id' => Level::factory(),
            'type' => fake()->randomElement(['excellence', 'merit', 'completion']),
            'title' => fake()->randomElement(['Academic Excellence', 'Merit Award', 'Course Completion']),
            'academic_year' => now()->format('Y'),
            'issued_on' => fake()->dateTimeBetween('-30 days', '+30 days')->format('Y-m-d'),
            'certificate_number' => 'CERT-'.fake()->unique()->numerify('######'),
            'status' => 'issued',
        ];
    }
}
