<?php

namespace Database\Factories;

use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'school_class_id' => SchoolClass::factory(),
            'level_id' => fn (array $attributes) => SchoolClass::find($attributes['school_class_id'])?->level_id,
            'code' => fake()->unique()->bothify('STU-####'),
            'name_kh' => fake()->name(),
            'name_en' => fake()->name(),
            'date_of_birth' => fake()->dateTimeBetween('-18 years', '-5 years')->format('Y-m-d'),
            'gender' => fake()->randomElement(['male', 'female']),
            'province' => fake()->state(),
            'district' => fake()->city(),
            'commune' => fake()->citySuffix(),
            'village' => fake()->streetName(),
            'parent_phone' => fake()->numerify('0#########'),
            'telegram_username' => fake()->optional()->userName(),
            'monthly_fee' => fake()->randomFloat(2, 20, 120),
            'scholarship_amount' => 0,
            'fee_status' => 'unpaid',
            'status' => 'active',
            'enrolled_on' => fake()->dateTimeBetween('-2 years')->format('Y-m-d'),
        ];
    }
}
