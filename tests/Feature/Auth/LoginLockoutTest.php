<?php

namespace Tests\Feature\Auth;

use App\Mail\LoginLockoutAlert;
use App\Models\SchoolSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LoginLockoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_shares_configured_lockout_settings(): void
    {
        $this->configureLoginSecurity(decaySeconds: '30');

        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/login')
                ->where('loginSecurity.maxAttempts', 2)
                ->where('loginSecurity.decaySeconds', 30)
            );
    }

    public function test_failed_login_shows_lockout_countdown_after_configured_attempts(): void
    {
        $this->configureLoginSecurity(decaySeconds: '30');

        $this->post(route('login.store'), [
            'email' => 'missing@example.test',
            'password' => 'wrong-password',
        ])->assertSessionHasErrors('email');

        $errors = session('errors')->get('email');

        $this->assertSame(
            trans('auth.failed').' 1 attempt remaining before lockout.',
            $errors[0],
        );

        $this->travel(5)->seconds();

        $response = $this->post(route('login.store'), [
            'email' => 'missing@example.test',
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors('email');

        $errors = session('errors')->get('email');

        $this->assertStringStartsWith('Too many login attempts. Please try again in ', $errors[0]);
        $this->assertGreaterThanOrEqual(29, $this->lockoutSecondsFromMessage($errors[0]));
    }

    public function test_login_lockout_sends_alert_email_for_missing_identifier(): void
    {
        Mail::fake();

        $this->configureLoginSecurity(alertEmail: 'security@example.test');

        foreach (range(1, 2) as $attempt) {
            $this->post(route('login.store'), [
                'email' => 'unknown-student-code',
                'password' => 'wrong-password',
            ]);
        }

        Mail::assertSent(LoginLockoutAlert::class, function (LoginLockoutAlert $mail): bool {
            return $mail->hasTo('security@example.test')
                && $mail->details['identifier'] === 'unknown-student-code'
                && $mail->details['availableIn'] > 0;
        });
    }

    public function test_login_lockout_alert_email_is_sent_once_per_lockout_window(): void
    {
        Mail::fake();

        $this->configureLoginSecurity(alertEmail: 'security@example.test', decaySeconds: '30');

        foreach (range(1, 4) as $attempt) {
            $this->post(route('login.store'), [
                'email' => 'duplicate-lockout@example.test',
                'password' => 'wrong-password',
            ]);
        }

        Mail::assertSent(LoginLockoutAlert::class, 1);
    }

    private function configureLoginSecurity(string $alertEmail = '', string $decaySeconds = '15'): void
    {
        SchoolSetting::query()->create([
            'group' => 'login',
            'key' => 'security',
            'value' => [
                'maxAttempts' => '2',
                'decaySeconds' => $decaySeconds,
                'alertEnabled' => true,
                'alertEmail' => $alertEmail,
            ],
        ]);
    }

    private function lockoutSecondsFromMessage(string $message): int
    {
        preg_match('/try again in (\d+) seconds/i', $message, $matches);

        return (int) ($matches[1] ?? 0);
    }
}
