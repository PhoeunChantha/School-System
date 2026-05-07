<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateNotificationRequest extends FormRequest
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
            'category' => ['required', 'string', Rule::in(['attendance', 'fees', 'homework', 'system'])],
            'title_kh' => ['nullable', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'body' => ['nullable', 'string', 'max:5000'],
            'severity' => ['required', 'string', Rule::in(['info', 'warning', 'urgent'])],
            'student_id' => ['nullable', 'integer', Rule::exists('students', 'id')->whereNull('deleted_at')],
            'user_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'is_read' => ['required', 'boolean'],
        ];
    }
}
