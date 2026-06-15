<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminTranslationManagementTest extends TestCase
{
    use RefreshDatabase;

    private string $temporaryLangPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->temporaryLangPath = storage_path('framework/testing/lang-'.Str::uuid());
        $this->app->useLangPath($this->temporaryLangPath);

        File::ensureDirectoryExists($this->temporaryLangPath.'/en');
        File::ensureDirectoryExists($this->temporaryLangPath.'/kh');
        File::put($this->temporaryLangPath.'/en/admin.php', "<?php\n\nreturn ['nav' => ['dashboard' => 'Dashboard']];\n");
        File::put($this->temporaryLangPath.'/kh/admin.php', "<?php\n\nreturn ['nav' => ['dashboard' => 'ទំព័រដើម']];\n");

        $this->seed(PermissionSeeder::class);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->temporaryLangPath);

        parent::tearDown();
    }

    public function test_authorized_user_can_view_translation_page(): void
    {
        $user = $this->authorizedUser(['translations.view']);

        $this->actingAs($user)
            ->get(route('admin.translations'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/translations/index')
                ->has('groups', 1)
                ->where('entries.0.group', 'admin')
                ->where('entries.0.key', 'nav.dashboard')
                ->where('entries.0.en', 'Dashboard')
                ->where('entries.0.kh', 'ទំព័រដើម'));
    }

    public function test_translation_can_be_created_in_both_language_files(): void
    {
        $user = $this->authorizedUser(['translations.view', 'translations.create']);

        $this->actingAs($user)
            ->post(route('admin.translations.store'), [
                'group' => 'admin',
                'key' => 'messages.saved',
                'en' => 'Saved successfully.',
                'kh' => 'បានរក្សាទុកដោយជោគជ័យ។',
            ])
            ->assertRedirect(route('admin.translations'));

        $this->assertSame('Saved successfully.', data_get(require $this->temporaryLangPath.'/en/admin.php', 'messages.saved'));
        $this->assertSame('បានរក្សាទុកដោយជោគជ័យ។', data_get(require $this->temporaryLangPath.'/kh/admin.php', 'messages.saved'));
        $this->assertDatabaseHas(ActivityLog::class, [
            'user_id' => $user->id,
            'event' => 'translation_created',
        ]);
    }

    public function test_translation_can_be_updated_and_deleted(): void
    {
        $user = $this->authorizedUser(['translations.view', 'translations.update', 'translations.delete']);

        $this->actingAs($user)
            ->put(route('admin.translations.update', ['group' => 'admin', 'key' => 'nav.dashboard']), [
                'en' => 'Home',
                'kh' => 'ទំព័រមេ',
            ])
            ->assertRedirect(route('admin.translations'));

        $this->assertSame('Home', data_get(require $this->temporaryLangPath.'/en/admin.php', 'nav.dashboard'));
        $this->assertSame('ទំព័រមេ', data_get(require $this->temporaryLangPath.'/kh/admin.php', 'nav.dashboard'));

        $this->actingAs($user)
            ->delete(route('admin.translations.destroy', ['group' => 'admin', 'key' => 'nav.dashboard']))
            ->assertRedirect(route('admin.translations'));

        $this->assertNull(data_get(require $this->temporaryLangPath.'/en/admin.php', 'nav.dashboard'));
        $this->assertNull(data_get(require $this->temporaryLangPath.'/kh/admin.php', 'nav.dashboard'));
        $this->assertDatabaseHas(ActivityLog::class, ['event' => 'translation_updated']);
        $this->assertDatabaseHas(ActivityLog::class, ['event' => 'translation_deleted']);
    }

    public function test_translation_routes_require_permissions(): void
    {
        $user = User::factory()->create();

        $this->be($user)
            ->get(route('admin.translations'))
            ->assertForbidden();
    }

    public function test_nested_translation_cannot_replace_an_existing_text_value(): void
    {
        $user = $this->authorizedUser(['translations.view', 'translations.create']);

        $this->actingAs($user)
            ->from(route('admin.translations'))
            ->post(route('admin.translations.store'), [
                'group' => 'admin',
                'key' => 'nav.dashboard.label',
                'en' => 'Dashboard label',
                'kh' => 'Dashboard label',
            ])
            ->assertRedirect(route('admin.translations'))
            ->assertSessionHasErrors('key');

        $this->assertSame('Dashboard', data_get(require $this->temporaryLangPath.'/en/admin.php', 'nav.dashboard'));
    }

    /** @param array<int, string> $permissions */
    private function authorizedUser(array $permissions): User
    {
        $user = User::factory()->create();
        $user->givePermissionTo($permissions);

        return $user;
    }
}
