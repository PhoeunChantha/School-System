<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class StoreHomeworkSubmissionRequest extends FormRequest
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
            'homework_assignment_id' => ['required', 'integer', Rule::exists('homework_assignments', 'id')],
            'student_id' => ['required', 'integer', Rule::exists('students', 'id')->whereNull('deleted_at')],
            'submitted_at' => ['nullable', 'date'],
            'score' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'attachment_file' => ['nullable', File::types(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png'])->max(10 * 1024)],
            'status' => ['required', 'string', Rule::in(['pending', 'submitted', 'graded', 'missing'])],
            'feedback' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
