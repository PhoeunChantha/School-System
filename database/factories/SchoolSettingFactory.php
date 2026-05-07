<?php

namespace Database\Factories;

use App\Models\SchoolSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SchoolSetting>
 */
class SchoolSettingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'group' => 'school',
            'key' => fake()->unique()->word(),
            'value' => ['text' => fake()->sentence()],
        ];
    }
}
