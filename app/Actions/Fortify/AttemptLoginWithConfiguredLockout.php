<?php

namespace App\Actions\Fortify;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Actions\AttemptToAuthenticate;
use Laravel\Fortify\Contracts\LockoutResponse;
use Laravel\Fortify\Fortify;

class AttemptLoginWithConfiguredLockout extends AttemptToAuthenticate
{
    /**
     * Throw a failed authentication validation exception.
     *
     * @param  Request  $request
     * @return mixed
     *
     * @throws ValidationException
     */
    protected function throwFailedAuthenticationException($request)
    {
        $this->limiter->increment($request);
        $attempts = $this->limiter->attempts($request);

        if ($attempts >= $this->maxAttempts()) {
            if (method_exists($this->limiter, 'lockout')) {
                $this->limiter->lockout($request);
            }

            event(new Lockout($request));

            return app(LockoutResponse::class)->toResponse($request);
        }

        throw ValidationException::withMessages([
            Fortify::username() => [
                $this->failedAuthenticationMessage($attempts),
            ],
        ]);
    }

    private function maxAttempts(): int
    {
        if (method_exists($this->limiter, 'maxAttempts')) {
            return $this->limiter->maxAttempts();
        }

        return 5;
    }

    private function failedAuthenticationMessage(int $attempts): string
    {
        $remainingAttempts = max(0, $this->maxAttempts() - $attempts);
        $attemptLabel = $remainingAttempts === 1 ? 'attempt' : 'attempts';

        return trans('auth.failed')." {$remainingAttempts} {$attemptLabel} remaining before lockout.";
    }
}
