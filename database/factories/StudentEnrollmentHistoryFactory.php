<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\StudentEnrollmentHistory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentEnrollmentHistory>
 */
class StudentEnrollmentHistoryFactory extends Factory
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
            'event_type' => 'enrolled',
            'to_level_id' => fn (array $attributes) => Student::find($attributes['student_id'])?->level_id,
            'to_school_class_id' => fn (array $attributes) => Student::find($attributes['student_id'])?->school_class_id,
            'to_status' => 'active',
            'effective_on' => now()->toDateString(),
            'changed_by' => User::factory(),
        ];
    }
}
