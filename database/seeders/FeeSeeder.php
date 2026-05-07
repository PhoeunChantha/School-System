<?php

namespace Database\Seeders;

use App\Models\FeeCharge;
use App\Models\Payment;
use App\Models\Student;
use Illuminate\Database\Seeder;

class FeeSeeder extends Seeder
{
    public function run(): void
    {
        if (FeeCharge::count() > 0) {
            return;
        }

        $year     = date('Y');
        $methods  = ['cash', 'aba', 'wing', 'bank'];
        $months   = [
            ['billing_month' => $year.'-01-01', 'due_on' => $year.'-01-05'],
            ['billing_month' => $year.'-02-01', 'due_on' => $year.'-02-05'],
            ['billing_month' => $year.'-03-01', 'due_on' => $year.'-03-05'],
            ['billing_month' => $year.'-04-01', 'due_on' => $year.'-04-05'],
        ];

        foreach (Student::all() as $student) {
            foreach ($months as $index => $month) {
                $amount   = (float) $student->monthly_fee;
                $isPaid   = $index < 3 && rand(0, 100) < 70; // ~70% paid for older months
                $isPartial = !$isPaid && rand(0, 100) < 30;

                $paidAmount = 0;
                if ($isPaid)    $paidAmount = $amount;
                if ($isPartial) $paidAmount = round($amount * (rand(3, 7) / 10), 2);

                $feeStatus = 'unpaid';
                if ($isPaid)    $feeStatus = 'paid';
                if ($isPartial) $feeStatus = 'partial';

                $charge = FeeCharge::create([
                    'student_id'      => $student->id,
                    'level_id'        => $student->level_id,
                    'billing_month'   => $month['billing_month'],
                    'academic_year'   => $year,
                    'due_on'          => $month['due_on'],
                    'amount'          => $amount,
                    'discount_amount' => 0,
                    'paid_amount'     => $paidAmount,
                    'status'          => $feeStatus,
                ]);

                if ($paidAmount > 0) {
                    Payment::create([
                        'fee_charge_id' => $charge->id,
                        'student_id'    => $student->id,
                        'amount'        => $paidAmount,
                        'method'        => $methods[array_rand($methods)],
                        'status'        => 'paid',
                        'paid_on'       => $month['billing_month'],
                        'billing_month' => $month['billing_month'],
                        'reference'     => 'REF-' . strtoupper(substr(uniqid(), -6)),
                    ]);
                }
            }

            // Update student fee_status based on latest charge
            $latestCharge = FeeCharge::where('student_id', $student->id)->latest('billing_month')->first();
            if ($latestCharge) {
                $student->update(['fee_status' => $latestCharge->status]);
            }
        }
    }
}
