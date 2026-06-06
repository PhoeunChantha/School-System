<?php

namespace Tests\Feature;

use App\Models\ParentAccessToken;
use App\Models\SchoolSetting;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ParentAccessLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_parent_access_link_sends_plasgate_sms_for_matching_parent_phone(): void
    {
        Http::fake([
            'cloudapi.plasgate.com/*' => Http::response(['success' => true]),
        ]);

        $this->enableParentSmsAccess();
        Student::factory()->create(['parent_phone' => '012 345 678']);

        $this->post(route('parent.access-link'), ['phone' => '012345678'])
            ->assertSessionHas('status', 'If this phone exists, we sent a parent access link.')
            ->assertValid();

        $this->assertDatabaseHas('parent_access_tokens', [
            'phone' => '85512345678',
            'used_at' => null,
        ]);

        Http::assertSent(function (Request $request): bool {
            $payload = $request->data();

            return str_starts_with($request->url(), 'https://cloudapi.plasgate.com/rest/send?private_key=private-key')
                && $request->header('X-Secret')[0] === 'secret-key'
                && $payload['to'] === '85512345678'
                && $payload['sender'] === 'Frania'
                && str_contains((string) $payload['content'], '/parent/access/');
        });
    }

    public function test_parent_access_link_does_not_send_sms_when_phone_is_unknown(): void
    {
        Http::fake();

        $this->enableParentSmsAccess();

        $this->post(route('parent.access-link'), ['phone' => '099999999'])
            ->assertSessionHas('status', 'If this phone exists, we sent a parent access link.')
            ->assertValid();

        $this->assertDatabaseCount('parent_access_tokens', 0);
        Http::assertNothingSent();
    }

    public function test_parent_access_link_requires_enabled_setting(): void
    {
        $this->post(route('parent.access-link'), ['phone' => '012345678'])
            ->assertInvalid(['phone' => 'Parent portal SMS access is currently disabled.']);
    }

    public function test_parent_access_link_sms_failure_does_not_consume_request_limit(): void
    {
        Http::fake([
            'cloudapi.plasgate.com/*' => Http::response(['message' => 'Forbidden'], 403),
        ]);

        $this->enableParentSmsAccess();
        Student::factory()->create(['parent_phone' => '012 345 678']);

        for ($attempt = 0; $attempt < 4; $attempt++) {
            $this->post(route('parent.access-link'), ['phone' => '012345678'])
                ->assertInvalid(['phone' => 'Unable to send SMS right now. Please contact the school.']);
        }

        Http::assertSentCount(4);
    }

    public function test_parent_access_link_normalizes_old_http_api_endpoint_for_rest_api_keys(): void
    {
        Http::fake([
            'cloudapi.plasgate.com/*' => Http::response(['success' => true]),
        ]);

        $this->enableParentSmsAccess([
            'plasgateEndpoint' => 'https://cloudapi.plasgate.com/api/send',
        ]);
        Student::factory()->create(['parent_phone' => '012 345 678']);

        $this->post(route('parent.access-link'), ['phone' => '012345678'])
            ->assertSessionHas('status', 'If this phone exists, we sent a parent access link.')
            ->assertValid();

        Http::assertSent(fn (Request $request): bool => str_starts_with(
            $request->url(),
            'https://cloudapi.plasgate.com/rest/send?private_key=private-key',
        ));
    }

    public function test_parent_access_token_allows_parent_dashboard_session(): void
    {
        $this->withoutVite();

        $plainToken = 'plain-token';
        Student::factory()->create([
            'parent_phone' => '012345678',
            'name_en' => 'Dara Keo',
        ]);
        ParentAccessToken::query()->create([
            'phone' => '85512345678',
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->addMinutes(10),
        ]);

        $this->get(route('parent.access.verify', ['token' => $plainToken]))
            ->assertRedirect(route('parent.dashboard', absolute: false));

        $this->get(route('parent.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('parent/dashboard/index')
                ->where('profile.name', 'Dara Keo')
                ->where('profile.childrenCount', 1));

        $this->assertDatabaseHas('parent_access_tokens', [
            'token_hash' => hash('sha256', $plainToken),
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function enableParentSmsAccess(array $overrides = []): void
    {
        SchoolSetting::factory()->create([
            'group' => 'login',
            'key' => 'security',
            'value' => array_merge([
                'maxAttempts' => '5',
                'decaySeconds' => '15',
                'alertEnabled' => true,
                'alertEmail' => '',
                'parentAccessEnabled' => true,
                'parentAccessExpiresMinutes' => '10',
                'parentSmsProvider' => 'plasgate',
                'plasgateEndpoint' => 'https://cloudapi.plasgate.com/rest/send',
                'plasgateSecret' => 'secret-key',
                'plasgatePrivate' => 'private-key',
                'plasgateSender' => 'Frania',
                'parentSmsTemplate' => 'Parent link: {link}. Expires in {minutes} minutes.',
            ], $overrides),
        ]);
    }
}
