<?php

namespace App\Models;

use App\Models\Concerns\HasEncryptedRouteKey;
use Database\Factories\SmsCommunicationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsCommunication extends Model
{
    /** @use HasFactory<SmsCommunicationFactory> */
    use HasEncryptedRouteKey, HasFactory;

    protected $fillable = [
        'student_id',
        'parent_access_token_id',
        'phone',
        'provider',
        'sender',
        'message',
        'status',
        'attempt_count',
        'provider_status',
        'provider_response',
        'failure_reason',
        'last_attempted_at',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'attempt_count' => 'integer',
            'provider_status' => 'integer',
            'last_attempted_at' => 'datetime',
            'sent_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function parentAccessToken(): BelongsTo
    {
        return $this->belongsTo(ParentAccessToken::class);
    }
}
