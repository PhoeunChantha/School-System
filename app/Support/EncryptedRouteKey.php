<?php

namespace App\Support;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

class EncryptedRouteKey
{
    public static function encrypt(string $key): string
    {
        return rtrim(strtr(Crypt::encryptString($key), '+/', '-_'), '=');
    }

    public static function decrypt(string $key): ?string
    {
        $encoded = strtr($key, '-_', '+/');
        $encoded .= str_repeat('=', (4 - strlen($encoded) % 4) % 4);

        try {
            return Crypt::decryptString($encoded);
        } catch (DecryptException) {
            return ctype_digit($key) ? $key : null;
        }
    }
}
