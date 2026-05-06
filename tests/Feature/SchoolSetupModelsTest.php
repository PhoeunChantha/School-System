<?php

namespace Tests\Feature;

use App\Models\Level;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolSetupModelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_school_class_belongs_to_level_and_teacher(): void
    {
        $level = Level::factory()->create();
        $teacher = Teacher::factory()->create();

        $schoolClass = SchoolClass::factory()
            ->for($level)
            ->for($teacher)
            ->create([
                'days' => ['mon', 'wed', 'fri'],
            ]);

        $this->assertTrue($schoolClass->level->is($level));
        $this->assertTrue($schoolClass->teacher->is($teacher));
        $this->assertSame(['mon', 'wed', 'fri'], $schoolClass->days);
        $this->assertTrue($level->schoolClasses->first()->is($schoolClass));
        $this->assertTrue($teacher->schoolClasses->first()->is($schoolClass));
    }

    public function test_active_scopes_return_only_active_records(): void
    {
        $level = Level::factory()->create(['is_active' => true]);
        Level::factory()->create(['is_active' => false]);
        $teacher = Teacher::factory()->create(['status' => 'active']);
        Teacher::factory()->create(['status' => 'inactive']);
        SchoolClass::factory()->for($level)->for($teacher)->create(['status' => 'active']);
        SchoolClass::factory()->for($level)->for($teacher)->create(['status' => 'inactive']);

        $this->assertSame(1, Level::active()->count());
        $this->assertSame(1, Teacher::active()->count());
        $this->assertSame(1, SchoolClass::active()->count());
    }

    public function test_creator_and_updater_relationships_are_available(): void
    {
        $creator = User::factory()->create();
        $updater = User::factory()->create();

        $level = Level::factory()->create([
            'created_by' => $creator->id,
            'updated_by' => $updater->id,
        ]);

        $this->assertTrue($level->creator->is($creator));
        $this->assertTrue($level->updater->is($updater));
    }
}
