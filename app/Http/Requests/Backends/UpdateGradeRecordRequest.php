<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGradeRecordRequest extends FormRequest
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
            'grade_period_id' => ['required', 'integer', Rule::exists('grade_periods', 'id')],
            'student_id' => ['required', 'integer', Rule::exists('students', 'id')->whereNull('deleted_at')],
            'school_class_id' => ['nullable', 'integer', Rule::exists('school_classes', 'id')->whereNull('deleted_at')],
            'speaking' => ['required', 'integer', 'min:0', 'max:100'],
            'listening' => ['required', 'integer', 'min:0', 'max:100'],
            'reading' => ['required', 'integer', 'min:0', 'max:100'],
            'writing' => ['required', 'integer', 'min:0', 'max:100'],
        ];
    }
}
