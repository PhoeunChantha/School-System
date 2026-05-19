<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();

        $intended = $request->session()->pull('url.intended');

        if ($intended) {
            return redirect()->to($intended);
        }

        if ($user?->hasRole('student')) {
            return redirect()->route('student.dashboard');
        }

        return redirect()->route('dashboard');
    }
}
