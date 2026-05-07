<?php

namespace Tests\Feature;

use App\Models\FeeCharge;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminFeeChargeCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_fee_page(): void
    {
        $this->actingAs(User::factory()->create());

        $student = Student::factory()->create(['name_en' => 'Sokh Dara']);
        FeeCharge::factory()->for($student)->create([
            'billing_month' => '2026-05-01',
            'amount' => 25,
        ]);

        $this->get(route('admin.fee'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/fee/index')
                ->has('charges', 1)
                ->where('charges.0.studentNameEn', 'Sokh Dara')
                ->where('charges.0.billingMonth', '2026-05'));
    }

    public function test_admin_can_view_create_fee_page(): void
    {
        $this->actingAs(User::factory()->create());

        Student::factory()->create(['name_en' => 'Sokh Dara']);

        $this->get(route('admin.fee.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/fee/create')
                ->has('students', 1));
    }

    public function test_admin_can_create_fee_charge(): void
    {
        $user = User::factory()->create();
        $student = Student::factory()->create();

        $this->actingAs($user)
            ->post(route('admin.fee.store'), $this->validPayload($student->id))
            ->assertRedirect(route('admin.fee'));

        $this->assertDatabaseHas('fee_charges', [
            'student_id' => $student->id,
            'billing_month' => '2026-05-01',
            'amount' => 25,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_view_edit_fee_page(): void
    {
        $this->actingAs(User::factory()->create());

        $feeCharge = FeeCharge::factory()->create([
            'billing_month' => '2026-05-01',
        ]);

        $this->get(route('admin.fee.edit', $feeCharge))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/fee/edit')
                ->where('charge.billing_month', '2026-05-01'));
    }

    public function test_admin_can_update_fee_charge(): void
    {
        $user = User::factory()->create();
        $feeCharge = FeeCharge::factory()->create([
            'amount' => 25,
            'billing_month' => '2026-05-01',
        ]);

        $payload = $this->validPayload($feeCharge->student_id);
        $payload['amount'] = 30;
        $payload['status'] = 'partial';

        $this->actingAs($user)
            ->put(route('admin.fee.update', $feeCharge), $payload)
            ->assertRedirect(route('admin.fee'));

        $this->assertDatabaseHas('fee_charges', [
            'id' => $feeCharge->id,
            'amount' => 30,
            'status' => 'partial',
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_delete_fee_charge(): void
    {
        $this->actingAs(User::factory()->create());

        $feeCharge = FeeCharge::factory()->create();

        $this->delete(route('admin.fee.destroy', $feeCharge))
            ->assertRedirect(route('admin.fee'));

        $this->assertDatabaseMissing('fee_charges', [
            'id' => $feeCharge->id,
        ]);
    }

    public function test_admin_can_record_payment(): void
    {
        $user = User::factory()->create();
        $feeCharge = FeeCharge::factory()->create([
            'amount' => 25,
            'discount_amount' => 0,
            'paid_amount' => 0,
            'status' => 'unpaid',
            'billing_month' => '2026-05-01',
        ]);

        $this->actingAs($user)
            ->post(route('admin.fee.payments.store', $feeCharge), [
                'amount' => 25,
                'method' => 'aba',
                'status' => 'paid',
                'paid_on' => '2026-05-07',
                'billing_month' => '2026-05-01',
                'reference' => 'ABA-001',
            ])
            ->assertRedirect(route('admin.fee'));

        $this->assertDatabaseHas('payments', [
            'fee_charge_id' => $feeCharge->id,
            'student_id' => $feeCharge->student_id,
            'amount' => 25,
            'recorded_by' => $user->id,
        ]);

        $this->assertDatabaseHas('fee_charges', [
            'id' => $feeCharge->id,
            'paid_amount' => 25,
            'status' => 'paid',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(int $studentId): array
    {
        return [
            'student_id' => $studentId,
            'level_id' => null,
            'billing_month' => '2026-05-01',
            'academic_year' => '2026',
            'due_on' => '2026-05-10',
            'amount' => 25,
            'discount_amount' => 0,
            'paid_amount' => 0,
            'status' => 'unpaid',
        ];
    }
}
