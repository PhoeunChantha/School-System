<?php

namespace Database\Factories;

use App\Models\AppInstallationEvent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AppInstallationEvent>
 */
class AppInstallationEventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'app_installation_link_id' => AppInstallationLink::factory(),
            'event' => fake()->randomElement(['opened', 'install_started', 'app_opened', 'confirmed']),
            'metadata' => [],
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
        ];
    }
}
