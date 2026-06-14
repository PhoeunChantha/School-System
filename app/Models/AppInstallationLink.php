<?php

namespace App\Models;

use App\Models\Concerns\HasEncryptedRouteKey;
use Database\Factories\AppInstallationLinkFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AppInstallationLink extends Model
{
    /** @use HasFactory<AppInstallationLinkFactory> */
    use HasEncryptedRouteKey, HasFactory;

    protected $fillable = [
        'student_id',
        'created_by',
        'regenerated_from_id',
        'audience',
        'token',
        'token_hash',
        'expires_at',
        'opened_at',
        'install_started_at',
        'app_opened_at',
        'confirmed_at',
        'last_opened_at',
        'revoked_at',
        'platform',
        'browser',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'token' => 'encrypted',
            'expires_at' => 'datetime',
            'opened_at' => 'datetime',
            'install_started_at' => 'datetime',
            'app_opened_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'last_opened_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function regeneratedFrom(): BelongsTo
    {
        return $this->belongsTo(self::class, 'regenerated_from_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(AppInstallationEvent::class);
    }

    public function isUsable(): bool
    {
        return $this->revoked_at === null && $this->expires_at->isFuture();
    }

    public function status(): string
    {
        if ($this->revoked_at !== null) {
            return 'revoked';
        }

        if ($this->expires_at->isPast() && $this->confirmed_at === null) {
            return 'expired';
        }

        if ($this->confirmed_at !== null) {
            return 'confirmed';
        }

        if ($this->app_opened_at !== null) {
            return 'app_opened';
        }

        if ($this->install_started_at !== null) {
            return 'installation_started';
        }

        if ($this->opened_at !== null) {
            return 'opened';
        }

        return 'generated';
    }
}
