<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExamResultRequest extends FormRequest
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
            'exam_id' => ['required', 'integer', Rule::exists('exams', 'id')->whereNull('deleted_at')],
            'student_id' => ['required', 'integer', Rule::exists('students', 'id')->whereNull('deleted_at')],
            'score' => ['nullable', 'numeric', 'min:0', 'max:999.99'],
            'max_score' => ['required', 'numeric', 'min:1', 'max:999.99'],
            'status' => ['required', 'string', Rule::in(['pending', 'passed', 'failed', 'absent'])],
            'note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
