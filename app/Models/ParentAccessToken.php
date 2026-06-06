<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParentAccessToken extends Model
{
    protected $fillable = [
        'phone',
        'token_hash',
        'expires_at',
        'used_at',
        'ip_address',
        'user_agent',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }
}
