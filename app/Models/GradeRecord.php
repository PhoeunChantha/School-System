<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradeRecord extends Model
{
    /** @use HasFactory<\Database\Factories\GradeRecordFactory> */
    use HasFactory;

    protected $fillable = [
        'grade_period_id',
        'student_id',
        'school_class_id',
        'speaking',
        'listening',
        'reading',
        'writing',
        'average',
        'graded_by',
        'updated_by',
        'graded_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'speaking' => 'integer',
            'listening' => 'integer',
            'reading' => 'integer',
            'writing' => 'integer',
            'average' => 'decimal:2',
            'graded_at' => 'datetime',
        ];
    }

    public function gradePeriod(): BelongsTo
    {
        return $this->belongsTo(GradePeriod::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class);
    }

    public function grader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
