<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Http\Requests\ParentAccessLinkRequest;
use App\Models\ParentAccessToken;
use App\Models\Student;
use App\Services\Parent\PlasGateSmsGateway;
use App\Support\ParentAccessSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class ParentAccessController extends Controller
{
    public function __construct(
        private readonly ParentAccessSettings $parentAccessSettings,
        private readonly PlasGateSmsGateway $smsGateway,
    ) {}

    public function sendLink(ParentAccessLinkRequest $request): RedirectResponse
    {
        $settings = $this->parentAccessSettings->data();

        if (! $settings['enabled']) {
            throw ValidationException::withMessages([
                'phone' => 'Parent portal SMS access is currently disabled.',
            ]);
        }

        $phone = $this->parentAccessSettings->normalizePhone($request->validated('phone'));
        $rateLimitKey = 'parent-access-link-v2:'.$phone.'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($rateLimitKey, 3)) {
            throw ValidationException::withMessages([
                'phone' => 'Too many requests. Please try again later.',
            ]);
        }

        RateLimiter::hit($rateLimitKey, 900);

        if (! $this->phoneExists($phone)) {
            return back()->with('status', 'If this phone exists, we sent a parent access link.');
        }

        $plainToken = Str::random(64);
        $accessToken = ParentAccessToken::query()->create([
            'phone' => $phone,
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->addMinutes($settings['expiresMinutes']),
            'ip_address' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
        ]);

        $link = route('parent.access.verify', [
            'token' => $plainToken,
        ]);

        $message = strtr($settings['smsTemplate'], [
            '{link}' => $link,
            '{minutes}' => (string) $settings['expiresMinutes'],
            '{school}' => config('app.name'),
        ]);

        try {
            $this->smsGateway->send($phone, $message, $settings);
        } catch (Throwable $exception) {
            $accessToken->delete();
            RateLimiter::clear($rateLimitKey);

            Log::error('Parent access SMS failed', [
                'phone' => $phone,
                'message' => $exception->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'phone' => 'Unable to send SMS right now. Please contact the school.',
            ]);
        }

        return back()->with('status', 'If this phone exists, we sent a parent access link.');
    }

    public function verify(Request $request, string $token): RedirectResponse
    {
        $tokenHash = hash('sha256', $token);

        $accessToken = ParentAccessToken::query()
            ->where('token_hash', $tokenHash)
            ->whereNull('used_at')
            ->where('expires_at', '>=', now())
            ->first();

        if (! $accessToken) {
            abort(403, 'This parent access link is invalid or expired.');
        }

        $accessToken->update(['used_at' => now()]);

        $request->session()->regenerate();
        $request->session()->put('parent_access_phone', $accessToken->phone);

        return to_route('parent.dashboard');
    }

    private function phoneExists(string $phone): bool
    {
        return Student::query()
            ->whereNotNull('parent_phone')
            ->get(['parent_phone'])
            ->contains(fn (Student $student): bool => $this->parentAccessSettings->normalizePhone((string) $student->parent_phone) === $phone);
    }
}
