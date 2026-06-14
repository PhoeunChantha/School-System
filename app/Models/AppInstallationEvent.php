<?php

namespace App\Models;

use Database\Factories\AppInstallationEventFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppInstallationEvent extends Model
{
    /** @use HasFactory<AppInstallationEventFactory> */
    use HasFactory;

    protected $fillable = [
        'app_installation_link_id',
        'event',
        'metadata',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return ['metadata' => 'array'];
    }

    public function link(): BelongsTo
    {
        return $this->belongsTo(AppInstallationLink::class, 'app_installation_link_id');
    }
}
