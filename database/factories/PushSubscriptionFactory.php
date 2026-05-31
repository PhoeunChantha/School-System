<?php

namespace Database\Factories;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PushSubscription>
 */
class PushSubscriptionFactory extends Factory
{
    public function definition(): array
    {
        $endpoint = fake()->unique()->url();

        return [
            'user_id' => User::factory(),
            'student_id' => null,
            'endpoint' => $endpoint,
            'endpoint_hash' => hash('sha256', $endpoint),
            'public_key' => fake()->sha256(),
            'auth_token' => fake()->sha1(),
            'content_encoding' => 'aes128gcm',
            'user_agent' => fake()->userAgent(),
            'last_used_at' => now(),
        ];
    }
}
