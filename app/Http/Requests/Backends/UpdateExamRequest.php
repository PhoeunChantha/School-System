<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class UpdateExamRequest extends FormRequest
{
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
        return [
            'school_class_id' => ['nullable', 'integer', Rule::exists('school_classes', 'id')->whereNull('deleted_at')],
            'title' => ['required', 'string', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'academic_year' => ['nullable', 'string', 'max:20'],
            'exam_date' => ['nullable', 'date'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'content' => ['nullable', 'string', 'max:100000'],
            'attachment' => ['nullable', File::types(['doc', 'docx', 'pdf'])->max(10 * 1024)],
            'status' => ['required', 'string', Rule::in(['draft', 'published', 'archived'])],
        ];
    }
}
