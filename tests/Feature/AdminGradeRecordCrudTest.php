<?php

namespace Tests\Feature;

use App\Models\GradePeriod;
use App\Models\GradeRecord;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class AdminGradeRecordCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_grades_page(): void
    {
        $this->actingAs(User::factory()->create());

        $period = GradePeriod::factory()->create(['name' => 'May 2026', 'is_current' => true]);
        $student = Student::factory()->create(['name_en' => 'Sokh Dara']);
        GradeRecord::factory()->for($period)->for($student)->create([
            'speaking' => 80,
            'listening' => 70,
            'reading' => 90,
            'writing' => 60,
            'average' => 75,
        ]);

        $this->get(route('admin.grades'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/grades/index')
                ->has('records', 1)
                ->where('records.0.studentNameEn', 'Sokh Dara')
                ->where('records.0.average', 75));
    }

    public function test_admin_can_create_grade_record(): void
    {
        $user = User::factory()->create();
        $period = GradePeriod::factory()->create(['is_current' => true]);
        $student = Student::factory()->create();

        $this->actingAs($user)
            ->post(route('admin.grades.store'), $this->validPayload($period->id, $student->id, $student->school_class_id))
            ->assertRedirect(route('admin.grades'));

        $this->assertDatabaseHas('grade_records', [
            'grade_period_id' => $period->id,
            'student_id' => $student->id,
            'speaking' => 80,
            'listening' => 70,
            'reading' => 90,
            'writing' => 60,
            'average' => 75,
            'graded_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_update_grade_record(): void
    {
        $user = User::factory()->create();
        $gradeRecord = GradeRecord::factory()->create([
            'speaking' => 50,
            'listening' => 50,
            'reading' => 50,
            'writing' => 50,
            'average' => 50,
        ]);

        $payload = $this->validPayload($gradeRecord->grade_period_id, $gradeRecord->student_id, $gradeRecord->school_class_id);
        $payload['speaking'] = 100;
        $payload['listening'] = 90;
        $payload['reading'] = 80;
        $payload['writing'] = 70;

        $this->actingAs($user)
            ->put(route('admin.grades.update', $gradeRecord), $payload)
            ->assertRedirect(route('admin.grades'));

        $this->assertDatabaseHas('grade_records', [
            'id' => $gradeRecord->id,
            'speaking' => 100,
            'listening' => 90,
            'reading' => 80,
            'writing' => 70,
            'average' => 85,
            'updated_by' => $user->id,
        ]);
    }

    public function test_admin_can_delete_grade_record(): void
    {
        $this->actingAs(User::factory()->create());

        $gradeRecord = GradeRecord::factory()->create();

        $this->delete(route('admin.grades.destroy', $gradeRecord))
            ->assertRedirect(route('admin.grades'));

        $this->assertDatabaseMissing('grade_records', [
            'id' => $gradeRecord->id,
        ]);
    }

    public function test_admin_can_download_grade_import_layout(): void
    {
        $this->actingAs(User::factory()->create());

        $response = $this->get(route('admin.grades.layout'))
            ->assertOk()
            ->assertDownload('grades-import-layout.csv');

        $this->assertStringContainsString('period,student_code,student_name_en,class,speaking,listening,reading,writing', $response->streamedContent());
    }

    public function test_admin_can_export_grade_records(): void
    {
        $this->actingAs(User::factory()->create());

        $schoolClass = SchoolClass::factory()->create(['name' => 'Export Class']);
        $period = GradePeriod::factory()->create(['name' => 'Export Period', 'is_current' => true]);
        $student = Student::factory()->for($schoolClass)->create([
            'code' => 'STU-3001',
            'name_en' => 'Export Student',
        ]);
        GradeRecord::factory()->for($period)->for($student)->create([
            'school_class_id' => $schoolClass->id,
            'speaking' => 90,
            'listening' => 85,
            'reading' => 88,
            'writing' => 84,
            'average' => 86.75,
        ]);

        $response = $this->get(route('admin.grades.export'))
            ->assertOk()
            ->assertDownload('grades-export.csv');

        $content = $response->streamedContent();

        $this->assertStringContainsString('Export Period', $content);
        $this->assertStringContainsString('STU-3001', $content);
        $this->assertStringContainsString('Export Student', $content);
        $this->assertStringContainsString('90,85,88,84', $content);
    }

    public function test_admin_can_import_grade_records_from_csv_layout(): void
    {
        $user = User::factory()->create();
        $schoolClass = SchoolClass::factory()->create(['name' => 'Beginner 1']);
        $period = GradePeriod::factory()->create(['name' => 'May 2026', 'is_current' => true]);
        $student = Student::factory()->for($schoolClass)->create([
            'code' => 'STU-1001',
            'name_en' => 'Sok Dara',
        ]);
        $csv = implode("\n", [
            'period,student_code,student_name_en,class,speaking,listening,reading,writing',
            'May 2026,STU-1001,Sok Dara,Beginner 1,80,75,82,78',
        ]);

        $this->actingAs($user)
            ->post(route('admin.grades.import'), [
                'import_file' => UploadedFile::fake()->createWithContent('grades.csv', $csv),
            ])
            ->assertRedirect(route('admin.grades'));

        $this->assertDatabaseHas('grade_records', [
            'grade_period_id' => $period->id,
            'student_id' => $student->id,
            'school_class_id' => $schoolClass->id,
            'speaking' => 80,
            'listening' => 75,
            'reading' => 82,
            'writing' => 78,
            'average' => 78.75,
            'graded_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(int $periodId, int $studentId, ?int $schoolClassId): array
    {
        return [
            'grade_period_id' => $periodId,
            'student_id' => $studentId,
            'school_class_id' => $schoolClassId,
            'speaking' => 80,
            'listening' => 70,
            'reading' => 90,
            'writing' => 60,
        ];
    }
}
