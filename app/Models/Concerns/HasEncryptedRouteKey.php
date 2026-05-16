<?php

namespace App\Models\Concerns;

use App\Support\EncryptedRouteKey;
use Illuminate\Database\Eloquent\ModelNotFoundException;

trait HasEncryptedRouteKey
{
    public function getRouteKey(): mixed
    {
        return self::encryptRouteKey((string) $this->getKey());
    }

    public function resolveRouteBinding($value, $field = null): mixed
    {
        $key = self::decryptRouteKey((string) $value);

        if ($key === null) {
            throw (new ModelNotFoundException)->setModel(static::class, [$value]);
        }

        return $this->where($field ?? $this->getKeyName(), $key)->firstOrFail();
    }

    public function routeKey(): string
    {
        return (string) $this->getRouteKey();
    }

    public static function encryptRouteKey(string $key): string
    {
        return EncryptedRouteKey::encrypt($key);
    }

    public static function decryptRouteKey(string $key): ?string
    {
        return EncryptedRouteKey::decrypt($key);
    }
}
