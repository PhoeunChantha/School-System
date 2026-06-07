<?php

namespace Tests\Feature;

use App\Models\GradePeriod;
use App\Models\GradeRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminGradePeriodCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_grade_period(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('admin.grade-periods.store'), [
                'name' => 'June 2026',
                'type' => 'monthly',
                'academic_year' => '2026',
                'starts_on' => '2026-06-01',
                'ends_on' => '2026-06-30',
                'is_current' => true,
            ])
            ->assertRedirect(route('admin.grade-periods'));

        $this->assertDatabaseHas('grade_periods', [
            'name' => 'June 2026',
            'type' => 'monthly',
            'academic_year' => '2026',
            'starts_on' => '2026-06-01',
            'ends_on' => '2026-06-30',
            'is_current' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    public function test_setting_period_current_unsets_previous_current_period(): void
    {
        $user = User::factory()->create();
        $oldCurrent = GradePeriod::factory()->create(['name' => 'May 2026', 'is_current' => true]);
        $newCurrent = GradePeriod::factory()->create(['name' => 'June 2026', 'is_current' => false]);

        $this->actingAs($user)
            ->put(route('admin.grade-periods.update', $newCurrent), [
                'name' => 'June 2026',
                'type' => 'monthly',
                'academic_year' => '2026',
                'starts_on' => '2026-06-01',
                'ends_on' => '2026-06-30',
                'is_current' => true,
            ])
            ->assertRedirect(route('admin.grade-periods'));

        $this->assertFalse($oldCurrent->refresh()->is_current);
        $this->assertTrue($newCurrent->refresh()->is_current);
        $this->assertSame($user->id, $newCurrent->updated_by);
    }

    public function test_admin_can_delete_unused_grade_period(): void
    {
        $this->actingAs(User::factory()->create());
        $period = GradePeriod::factory()->create(['name' => 'June 2026']);

        $this->delete(route('admin.grade-periods.destroy', $period))
            ->assertRedirect(route('admin.grade-periods'));

        $this->assertDatabaseMissing('grade_periods', [
            'id' => $period->id,
        ]);
    }

    public function test_admin_cannot_delete_grade_period_with_records(): void
    {
        $this->actingAs(User::factory()->create());
        $record = GradeRecord::factory()->create();

        $this->delete(route('admin.grade-periods.destroy', $record->gradePeriod))
            ->assertRedirect();

        $this->assertDatabaseHas('grade_periods', [
            'id' => $record->grade_period_id,
        ]);
    }

    public function test_admin_can_view_grade_period_pages(): void
    {
        $this->actingAs(User::factory()->create());
        $period = GradePeriod::factory()->create(['name' => 'June 2026', 'is_current' => true]);

        $this->get(route('admin.grade-periods'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/grade-periods/index')
                ->has('periods', 1)
                ->where('periods.0.name', 'June 2026'));

        $this->get(route('admin.grade-periods.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/grade-periods/create')
                ->where('defaults.name', now()->format('F Y')));

        $this->get(route('admin.grade-periods.edit', $period))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/grade-periods/edit')
                ->where('period.name', 'June 2026'));
    }
}
