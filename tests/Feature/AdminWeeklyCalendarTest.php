<?php

namespace Tests\Feature;

use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminWeeklyCalendarTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_active_classes_on_weekly_calendar(): void
    {
        $this->seed(PermissionSeeder::class);
        $this->seed(RoleSeeder::class);

        $user = User::factory()->create();
        $user->syncRoles([Role::query()->where('name', 'admin')->firstOrFail()]);

        $this->actingAs($user);

        $teacher = Teacher::factory()->create(['name_en' => 'Mr. Dara']);

        SchoolClass::factory()->for($teacher)->create([
            'name' => 'Beginner A',
            'room' => 'R01',
            'starts_at' => '07:00:00',
            'ends_at' => '09:00:00',
            'days' => ['mon', 'wed', 'fri'],
            'status' => 'active',
        ]);

        SchoolClass::factory()->create([
            'name' => 'Inactive Class',
            'status' => 'inactive',
        ]);

        $this->get(route('admin.weekly-calendar'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/weekly-calendar/index')
                ->has('schedule', 1)
                ->where('schedule.0.name', 'Beginner A')
                ->where('schedule.0.teacher', 'Mr. Dara')
                ->where('schedule.0.room', 'R01')
                ->where('schedule.0.days', ['mon', 'wed', 'fri']));
    }
}
