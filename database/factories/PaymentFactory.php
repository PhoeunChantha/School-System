<?php

namespace Database\Factories;

use App\Models\FeeCharge;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'fee_charge_id' => FeeCharge::factory(),
            'student_id' => fn (array $attributes) => FeeCharge::find($attributes['fee_charge_id'])?->student_id,
            'amount' => fake()->randomFloat(2, 10, 120),
            'method' => fake()->randomElement(['cash', 'aba', 'wing', 'bank']),
            'status' => 'paid',
            'paid_on' => fake()->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'billing_month' => fn (array $attributes) => FeeCharge::find($attributes['fee_charge_id'])?->billing_month,
            'reference' => fake()->optional()->bothify('REF-####'),
            'screenshot_path' => fake()->optional()->filePath(),
        ];
    }
}
