<?php

namespace App\Http\Responses;

use App\Support\RoleRedirect;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): Response
    {
        return redirect()->to(RoleRedirect::intendedOrDefaultPathFor($request));
    }
}
