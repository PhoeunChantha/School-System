<?php

namespace App\Http\Requests\Backends;

use App\Models\LessonPlan;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Validator;

class UpdateLessonPlanRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->mergeIfMissing(['input_mode' => 'details']);
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $lessonPlan = $this->route('lessonPlan');
        $removedIds = collect($this->input('removed_attachment_ids', []))->map(fn (mixed $id): int => (int) $id);
        $hasRemainingAttachment = $lessonPlan instanceof LessonPlan
            && $lessonPlan->attachments()->whereNotIn('id', $removedIds)->exists();

        return [
            'teacher_id' => ['required', 'integer', Rule::exists('teachers', 'id')],
            'school_class_id' => ['required', 'integer', Rule::exists('school_classes', 'id')],
            'lesson_date' => ['required', 'date'],
            'input_mode' => ['required', 'string', Rule::in(['details', 'files'])],
            'title' => [Rule::requiredIf($this->string('input_mode')->toString() === 'details'), 'nullable', 'string', 'max:255'],
            'objective' => ['nullable', 'string', 'max:2000'],
            'content' => ['nullable', 'string', 'max:4000'],
            'materials' => ['nullable', 'string', 'max:2000'],
            'homework' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', 'string', Rule::in(['planned', 'taught', 'cancelled'])],
            'attachments' => [
                Rule::requiredIf($this->string('input_mode')->toString() === 'files' && ! $hasRemainingAttachment),
                'nullable',
                'array',
                'max:10',
            ],
            'attachments.*' => [
                'file',
                File::types(['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'])->max(15 * 1024),
            ],
            'removed_attachment_ids' => ['nullable', 'array'],
            'removed_attachment_ids.*' => ['integer', Rule::exists('lesson_plan_attachments', 'id')->where('lesson_plan_id', $lessonPlan?->id)],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $lessonPlan = $this->route('lessonPlan');

            if (! $lessonPlan instanceof LessonPlan || $this->string('input_mode')->toString() !== 'files') {
                return;
            }

            $removedIds = collect($this->input('removed_attachment_ids', []))->map(fn (mixed $id): int => (int) $id);
            $existingCount = $lessonPlan->attachments()->whereNotIn('id', $removedIds)->count();
            $newCount = count($this->file('attachments', []));

            if ($existingCount + $newCount > 10) {
                $validator->errors()->add('attachments', 'A lesson plan can contain at most 10 files.');
            }
        }];
    }
}
