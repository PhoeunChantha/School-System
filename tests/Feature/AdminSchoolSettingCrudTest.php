<?php

namespace Tests\Feature;

use App\Models\Level;
use App\Models\SchoolSetting;
use App\Models\User;
use App\Services\Backends\SchoolSettingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class AdminSchoolSettingCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_settings_page(): void
    {
        $this->actingAs(User::factory()->create());

        SchoolSetting::factory()->create([
            'group' => 'school',
            'key' => 'profile',
            'value' => [
                'nameKh' => 'សាលា សាកល្បង',
                'nameEn' => 'Testing School',
            ],
        ]);

        $this->get(route('admin.settings'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/settings/index')
                ->where('settings.school.nameEn', 'Testing School')
                ->where('settings.seo.title', 'Frania English School')
                ->has('settings.database.databaseName')
                ->has('settings.searchConsole.verificationFile')
                ->where('settings.school.nameKh', 'សាលា សាកល្បង'));
    }

    public function test_admin_can_update_school_settings(): void
    {
        $user = User::factory()->create();

        $payload = [
            'value' => [
                'nameKh' => 'សាលា Frania',
                'nameEn' => 'Frania English School',
                'address' => 'Phnom Penh',
                'phone' => '023-123-456',
                'email' => 'info@example.test',
                'telegram' => '@school',
                'principal' => 'Mr. Vuthy',
                'founded' => '2018',
            ],
        ];

        $this->actingAs($user)
            ->put(route('admin.settings.update', 'school'), $payload)
            ->assertRedirect(route('admin.settings'));

        $setting = SchoolSetting::query()
            ->where('group', 'school')
            ->where('key', 'profile')
            ->firstOrFail();

        $this->assertSame('Frania English School', $setting->value['nameEn']);
        $this->assertSame($user->id, $setting->created_by);
        $this->assertSame($user->id, $setting->updated_by);
    }

    public function test_admin_can_update_fee_settings(): void
    {
        $this->actingAs(User::factory()->create());

        Level::factory()->create(['name' => 'Beginner 1', 'monthly_fee' => 20]);

        $payload = [
            'value' => [
                'levelFees' => [
                    ['level' => 'Beginner 1', 'fee' => 25],
                ],
                'lateFee' => '5',
                'dueDay' => '7',
            ],
        ];

        $this->put(route('admin.settings.update', 'fees'), $payload)
            ->assertRedirect(route('admin.settings'));

        $setting = SchoolSetting::query()
            ->where('group', 'fees')
            ->where('key', 'policy')
            ->firstOrFail();

        $this->assertSame('7', $setting->value['dueDay']);
        $this->assertSame(25, $setting->value['levelFees'][0]['fee']);
    }

    public function test_admin_can_update_seo_settings(): void
    {
        $this->actingAs(User::factory()->create());

        $payload = [
            'value' => [
                'title' => 'Frania School Cambodia',
                'description' => 'English school in Cambodia.',
                'keywords' => 'Frania, English school, Cambodia',
                'canonicalUrl' => 'https://frania.example.test',
                'robots' => 'index,follow',
                'seoImage' => 'uploads/school/seo.jpg',
            ],
        ];

        $this->put(route('admin.settings.update', 'seo'), $payload)
            ->assertRedirect(route('admin.settings'));

        $setting = SchoolSetting::query()
            ->where('group', 'seo')
            ->where('key', 'meta')
            ->firstOrFail();

        $this->assertSame('Frania School Cambodia', $setting->value['title']);
        $this->assertSame('index,follow', $setting->value['robots']);
    }

    public function test_admin_can_update_notification_settings(): void
    {
        $this->actingAs(User::factory()->create());

        $payload = [
            'value' => [
                'attendanceAlert' => true,
                'lowAttendanceThreshold' => '75',
                'feeReminder' => false,
                'feeReminderDays' => '3',
                'homeworkDue' => true,
                'systemUpdates' => true,
            ],
        ];

        $this->put(route('admin.settings.update', 'notifications'), $payload)
            ->assertRedirect(route('admin.settings'));

        $setting = SchoolSetting::query()
            ->where('group', 'notifications')
            ->where('key', 'preferences')
            ->firstOrFail();

        $this->assertSame('75', $setting->value['lowAttendanceThreshold']);
        $this->assertFalse($setting->value['feeReminder']);
    }

    public function test_database_setting_updates_environment_file(): void
    {
        $path = storage_path('framework/testing/settings-env');
        file_put_contents($path, "APP_NAME=Testing\nDB_DATABASE=old_demo\n");

        $databaseName = (string) config('database.connections.'.config('database.default').'.database');

        try {
            (new SchoolSettingService($path))->updateDatabaseName($databaseName);

            $this->assertStringContainsString(
                'DB_DATABASE='.$databaseName,
                file_get_contents($path),
            );
        } finally {
            if (file_exists($path)) {
                unlink($path);
            }
        }
    }

    public function test_admin_can_upload_search_console_verification_file(): void
    {
        $this->actingAs(User::factory()->create());

        $filename = 'googleb060d26401f59404.html';
        $target = public_path($filename);
        $source = storage_path('framework/testing/'.$filename);

        if (! is_dir(dirname($source))) {
            mkdir(dirname($source), 0755, true);
        }

        file_put_contents($source, 'google-site-verification: '.$filename);

        try {
            $this->post(route('admin.settings.search-console-file'), [
                'verification_file' => new UploadedFile(
                    $source,
                    $filename,
                    'text/html',
                    null,
                    true,
                ),
            ])->assertRedirect();

            $this->assertFileExists($target);
            $this->assertSame(
                'google-site-verification: '.$filename,
                file_get_contents($target),
            );
        } finally {
            if (file_exists($source)) {
                unlink($source);
            }

            if (file_exists($target)) {
                unlink($target);
            }
        }
    }
}
