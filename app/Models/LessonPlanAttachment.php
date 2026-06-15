<?php

namespace App\Models;

use Database\Factories\LessonPlanAttachmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonPlanAttachment extends Model
{
    /** @use HasFactory<LessonPlanAttachmentFactory> */
    use HasFactory;

    protected $fillable = [
        'lesson_plan_id',
        'original_name',
        'path',
        'mime_type',
        'size',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function lessonPlan(): BelongsTo
    {
        return $this->belongsTo(LessonPlan::class);
    }
}
