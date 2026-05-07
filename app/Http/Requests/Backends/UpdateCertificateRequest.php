<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCertificateRequest extends FormRequest
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
            'student_id' => ['required', 'integer', Rule::exists('students', 'id')->whereNull('deleted_at')],
            'level_id' => ['nullable', 'integer', Rule::exists('levels', 'id')->whereNull('deleted_at')],
            'type' => ['required', 'string', Rule::in(['excellence', 'merit', 'completion', 'participation'])],
            'title' => ['required', 'string', 'max:255'],
            'academic_year' => ['nullable', 'string', 'max:20'],
            'issued_on' => ['required', 'date'],
            'certificate_number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('certificates', 'certificate_number')->ignore($this->route('certificate')),
            ],
            'status' => ['required', 'string', Rule::in(['issued', 'draft', 'void'])],
        ];
    }
}
