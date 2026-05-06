<?php

namespace Tests\Feature;

use App\Models\FeeCharge;
use App\Models\Level;
use App\Models\Payment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FeeModelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_fee_charge_belongs_to_student_and_level(): void
    {
        $level = Level::factory()->create();
        $teacher = Teacher::factory()->create();
        $schoolClass = SchoolClass::factory()->for($level)->for($teacher)->create();
        $student = Student::factory()->for($level)->for($schoolClass)->create();

        $charge = FeeCharge::factory()
            ->for($student)
            ->for($level)
            ->create([
                'amount' => 100,
                'discount_amount' => 10,
                'paid_amount' => 0,
                'status' => 'unpaid',
            ]);

        $this->assertTrue($charge->student->is($student));
        $this->assertTrue($charge->level->is($level));
        $this->assertTrue($student->feeCharges->first()->is($charge));
        $this->assertTrue($level->feeCharges->first()->is($charge));
        $this->assertSame('100.00', $charge->amount);
        $this->assertSame(1, FeeCharge::unpaid()->count());
    }

    public function test_payment_links_charge_student_and_recorder(): void
    {
        $student = Student::factory()->create();
        $charge = FeeCharge::factory()->for($student)->create();
        $recorder = User::factory()->create();

        $payment = Payment::factory()
            ->for($charge)
            ->for($student)
            ->create([
                'amount' => 50,
                'recorded_by' => $recorder->id,
            ]);

        $this->assertTrue($payment->feeCharge->is($charge));
        $this->assertTrue($payment->student->is($student));
        $this->assertTrue($payment->recorder->is($recorder));
        $this->assertTrue($charge->payments->first()->is($payment));
        $this->assertTrue($student->payments->first()->is($payment));
        $this->assertSame('50.00', $payment->amount);
        $this->assertSame(1, Payment::paid()->count());
    }
}
