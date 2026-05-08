<?php

namespace App\Models;

use Database\Factories\SchoolClassFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolClass extends Model
{
    /** @use HasFactory<SchoolClassFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'level_id',
        'teacher_id',
        'name',
        'room',
        'starts_at',
        'ends_at',
        'days',
        'capacity',
        'academic_year',
        'status',
        'created_by',
        'updated_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'days' => 'array',
            'capacity' => 'integer',
        ];
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function attendanceSessions(): HasMany
    {
        return $this->hasMany(AttendanceSession::class);
    }

    public function gradeRecords(): HasMany
    {
        return $this->hasMany(GradeRecord::class);
    }

    public function homeworkAssignments(): HasMany
    {
        return $this->hasMany(HomeworkAssignment::class);
    }

    public function lessonPlans(): HasMany
    {
        return $this->hasMany(LessonPlan::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }
}
