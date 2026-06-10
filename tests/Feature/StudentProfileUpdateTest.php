<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class StudentProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_update_profile_fields_and_activity_log_is_created(): void
    {
        $user = User::factory()->create();
        $student = Student::factory()->create([
            'user_id' => $user->id,
            'date_of_birth' => '2015-01-10',
            'province' => 'Phnom Penh',
            'district' => 'Chamkarmon',
            'updated_by' => null,
        ]);

        $this->actingAs($user)
            ->put(route('student.profile.update'), [
                'date_of_birth' => '2014-06-15',
                'province' => 'Siem Reap',
                'district' => 'Svay Dangkum',
            ])
            ->assertRedirect();

        $student->refresh();

        $this->assertSame('2014-06-15', $student->date_of_birth?->toDateString());
        $this->assertSame('Siem Reap', $student->province);
        $this->assertSame('Svay Dangkum', $student->district);
        $this->assertSame($user->id, $student->updated_by);

        $activityLog = ActivityLog::query()
            ->where('event', 'student_profile_updated')
            ->where('subject_type', Student::class)
            ->where('subject_id', $student->id)
            ->first();

        $this->assertNotNull($activityLog);
        $this->assertSame($user->id, $activityLog->user_id);
        $this->assertSame('student_portal', $activityLog->properties['source']);
        $this->assertSame(
            ['date_of_birth', 'province', 'district'],
            $activityLog->properties['changed_fields'],
        );
    }

    public function test_student_profile_update_does_not_log_when_nothing_changed(): void
    {
        $user = User::factory()->create();
        Student::factory()->create([
            'user_id' => $user->id,
            'date_of_birth' => '2015-01-10',
            'province' => 'Phnom Penh',
            'district' => 'Chamkarmon',
        ]);

        $this->actingAs($user)
            ->put(route('student.profile.update'), [
                'date_of_birth' => '2015-01-10',
                'province' => 'Phnom Penh',
                'district' => 'Chamkarmon',
            ])
            ->assertRedirect();

        $this->assertDatabaseMissing('activity_logs', [
            'event' => 'student_profile_updated',
        ]);
    }

    public function test_student_profile_update_validates_future_date_of_birth(): void
    {
        $user = User::factory()->create();
        Student::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->put(route('student.profile.update'), [
                'date_of_birth' => now()->addDay()->format('Y-m-d'),
                'province' => 'Phnom Penh',
                'district' => 'Chamkarmon',
            ])
            ->assertSessionHasErrors('date_of_birth');
    }

    public function test_student_can_update_profile_photo(): void
    {
        $user = User::factory()->create();
        $student = Student::factory()->create([
            'user_id' => $user->id,
            'profile_photo' => null,
        ]);

        $this->actingAs($user)
            ->post(route('student.profile.update'), [
                '_method' => 'put',
                'profile_photo' => UploadedFile::fake()->image('avatar.jpg'),
                'date_of_birth' => $student->date_of_birth?->toDateString(),
                'province' => $student->province,
                'district' => $student->district,
            ])
            ->assertRedirect();

        $student->refresh();

        $this->assertNotNull($student->profile_photo);
        $this->assertFileExists(public_path($student->profile_photo));

        $activityLog = ActivityLog::query()
            ->where('event', 'student_profile_updated')
            ->where('subject_type', Student::class)
            ->where('subject_id', $student->id)
            ->first();

        $this->assertNotNull($activityLog);
        $this->assertContains('profile_photo', $activityLog->properties['changed_fields']);

        @unlink(public_path($student->profile_photo));
    }
}
