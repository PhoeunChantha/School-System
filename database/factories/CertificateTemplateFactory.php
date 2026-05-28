<?php

namespace Database\Factories;

use App\Models\CertificateTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CertificateTemplate>
 */
class CertificateTemplateFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'template_image_path' => 'uploads/certificates/templates/default.png',
            'logo_image_path' => null,
            'layout' => [
                'heading' => 'Certificate',
                'presented_to' => 'This certificate is presented to',
                'body' => 'For completing the course with dedication and strong progress.',
                'grade' => 'Grade A+',
                'teacher_signature' => 'Teacher Signature',
                'director_signature' => 'School Director',
                'director_name' => '',
            ],
            'is_active' => true,
        ];
    }
}
