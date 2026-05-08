<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLessonPlanRequest extends FormRequest
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
            'teacher_id' => ['required', 'integer', Rule::exists('teachers', 'id')],
            'school_class_id' => ['required', 'integer', Rule::exists('school_classes', 'id')],
            'lesson_date' => ['required', 'date'],
            'title' => ['required', 'string', 'max:255'],
            'objective' => ['nullable', 'string', 'max:2000'],
            'content' => ['nullable', 'string', 'max:4000'],
            'materials' => ['nullable', 'string', 'max:2000'],
            'homework' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', 'string', Rule::in(['planned', 'taught', 'cancelled'])],
        ];
    }
}
