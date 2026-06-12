<?php

namespace App\Models;

use App\Models\Concerns\HasEncryptedRouteKey;
use Database\Factories\StudentEnrollmentHistoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentEnrollmentHistory extends Model
{
    /** @use HasFactory<StudentEnrollmentHistoryFactory> */
    use HasEncryptedRouteKey, HasFactory;

    protected $fillable = [
        'student_id',
        'event_type',
        'from_level_id',
        'to_level_id',
        'from_school_class_id',
        'to_school_class_id',
        'from_status',
        'to_status',
        'effective_on',
        'note',
        'changed_by',
    ];

    protected function casts(): array
    {
        return [
            'effective_on' => 'date',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class)->withTrashed();
    }

    public function fromLevel(): BelongsTo
    {
        return $this->belongsTo(Level::class, 'from_level_id');
    }

    public function toLevel(): BelongsTo
    {
        return $this->belongsTo(Level::class, 'to_level_id');
    }

    public function fromSchoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'from_school_class_id');
    }

    public function toSchoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'to_school_class_id');
    }

    public function changedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
