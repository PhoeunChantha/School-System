<?php

namespace App\Services\Backends;

use App\Models\FeeCharge;
use App\Models\Payment;
use App\Models\Student;
use Illuminate\Support\Facades\DB;

class FeeChargeService
{
    /**
     * @return array{charges: mixed, payments: mixed, summary: array<string, mixed>}
     */
    public function indexData(): array
    {
        $charges = FeeCharge::query()
            ->with(['student:id,name_kh,name_en,level_id,school_class_id', 'student.level:id,name', 'student.schoolClass:id,name'])
            ->latest('billing_month')
            ->latest('id')
            ->get()
            ->map(fn (FeeCharge $feeCharge): array => $this->chargePayload($feeCharge));

        $payments = Payment::query()
            ->with(['student:id,name_kh,name_en', 'feeCharge:id,billing_month'])
            ->latest('paid_on')
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(fn (Payment $payment): array => [
                'id' => $payment->id,
                'studentNameKh' => $payment->student?->name_kh ?? '',
                'studentNameEn' => $payment->student?->name_en ?? 'Unknown student',
                'amount' => (float) $payment->amount,
                'method' => strtoupper($payment->method),
                'status' => $payment->status,
                'paidOn' => $payment->paid_on?->format('Y-m-d') ?? '',
                'billingMonth' => $payment->billing_month?->format('Y-m') ?? '',
                'reference' => $payment->reference ?? '',
            ]);

        return [
            'charges' => $charges,
            'payments' => $payments,
            'summary' => [
                'collected' => Payment::query()->whereIn('status', ['paid', 'verified'])->sum('amount'),
                'outstanding' => FeeCharge::query()->whereIn('status', ['unpaid', 'partial'])->sum(DB::raw('amount - discount_amount - paid_amount')),
                'paidCount' => FeeCharge::query()->where('status', 'paid')->count(),
                'unpaidCount' => FeeCharge::query()->where('status', 'unpaid')->count(),
            ],
        ];
    }

    /**
     * @return array{students: mixed}
     */
    public function createData(): array
    {
        return [
            'students' => $this->studentOptions(),
        ];
    }

    /**
     * @return array{charge: array<string, mixed>, students: mixed}
     */
    public function editData(FeeCharge $feeCharge): array
    {
        return [
            'charge' => [
                'id' => $feeCharge->id,
                'student_id' => $feeCharge->student_id,
                'level_id' => $feeCharge->level_id,
                'billing_month' => $feeCharge->billing_month?->format('Y-m-d') ?? '',
                'academic_year' => $feeCharge->academic_year ?? '',
                'due_on' => $feeCharge->due_on?->format('Y-m-d') ?? '',
                'amount' => $feeCharge->amount,
                'discount_amount' => $feeCharge->discount_amount,
                'paid_amount' => $feeCharge->paid_amount,
                'status' => $feeCharge->status,
            ],
            'students' => $this->studentOptions(),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): FeeCharge
    {
        return DB::transaction(fn (): FeeCharge => FeeCharge::create([
            ...$this->normalizedChargeData($data),
            'created_by' => $userId,
            'updated_by' => $userId,
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(FeeCharge $feeCharge, array $data, ?int $userId): FeeCharge
    {
        return DB::transaction(function () use ($feeCharge, $data, $userId): FeeCharge {
            $feeCharge->update([
                ...$this->normalizedChargeData($data),
                'updated_by' => $userId,
            ]);

            return $feeCharge->refresh();
        });
    }

    public function delete(FeeCharge $feeCharge): void
    {
        DB::transaction(fn (): ?bool => $feeCharge->delete());
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function recordPayment(FeeCharge $feeCharge, array $data, ?int $userId): Payment
    {
        return DB::transaction(function () use ($feeCharge, $data, $userId): Payment {
            $payment = Payment::create([
                ...$data,
                'fee_charge_id' => $feeCharge->id,
                'student_id' => $feeCharge->student_id,
                'recorded_by' => $userId,
            ]);

            $paidAmount = (float) $feeCharge->payments()->whereIn('status', ['paid', 'verified'])->sum('amount');
            $netAmount = max(0, (float) $feeCharge->amount - (float) $feeCharge->discount_amount);

            $feeCharge->update([
                'paid_amount' => $paidAmount,
                'status' => $paidAmount >= $netAmount ? 'paid' : ($paidAmount > 0 ? 'partial' : 'unpaid'),
                'updated_by' => $userId,
            ]);

            $feeCharge->student()->update([
                'fee_status' => $paidAmount >= $netAmount ? 'paid' : ($paidAmount > 0 ? 'partial' : 'unpaid'),
                'updated_by' => $userId,
            ]);

            return $payment;
        });
    }

    /**
     * @return mixed
     */
    private function studentOptions()
    {
        return Student::query()
            ->active()
            ->with(['level:id,name', 'schoolClass:id,name'])
            ->orderBy('name_en')
            ->get(['id', 'level_id', 'school_class_id', 'name_kh', 'name_en', 'monthly_fee'])
            ->map(fn (Student $student): array => [
                'id' => $student->id,
                'nameKh' => $student->name_kh,
                'nameEn' => $student->name_en,
                'levelId' => $student->level_id,
                'level' => $student->level?->name ?? '',
                'className' => $student->schoolClass?->name ?? '',
                'monthlyFee' => $student->monthly_fee,
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function chargePayload(FeeCharge $feeCharge): array
    {
        return [
            'id' => $feeCharge->id,
            'studentNameKh' => $feeCharge->student?->name_kh ?? '',
            'studentNameEn' => $feeCharge->student?->name_en ?? 'Unknown student',
            'level' => $feeCharge->student?->level?->name ?? '',
            'className' => $feeCharge->student?->schoolClass?->name ?? '',
            'billingMonth' => $feeCharge->billing_month?->format('Y-m') ?? '',
            'dueOn' => $feeCharge->due_on?->format('Y-m-d') ?? '',
            'amount' => (float) $feeCharge->amount,
            'discountAmount' => (float) $feeCharge->discount_amount,
            'paidAmount' => (float) $feeCharge->paid_amount,
            'status' => $feeCharge->status,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizedChargeData(array $data): array
    {
        $student = Student::query()->find($data['student_id']);

        return [
            'student_id' => $data['student_id'],
            'level_id' => $data['level_id'] ?? $student?->level_id,
            'billing_month' => $data['billing_month'],
            'academic_year' => $data['academic_year'] ?? null,
            'due_on' => $data['due_on'] ?? null,
            'amount' => $data['amount'],
            'discount_amount' => $data['discount_amount'] ?? 0,
            'paid_amount' => $data['paid_amount'] ?? 0,
            'status' => $data['status'],
        ];
    }
}
