<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentRequest extends FormRequest
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
            'level_id' => ['nullable', 'integer', Rule::exists('levels', 'id')],
            'school_class_id' => ['nullable', 'integer', Rule::exists('school_classes', 'id')],
            'code' => ['nullable', 'string', 'max:255', Rule::unique('students', 'code')->whereNull('deleted_at')],
            'name_kh' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', Rule::in(['male', 'female'])],
            'province' => ['nullable', 'string', 'max:255'],
            'district' => ['nullable', 'string', 'max:255'],
            'commune' => ['nullable', 'string', 'max:255'],
            'village' => ['nullable', 'string', 'max:255'],
            'parent_phone' => ['nullable', 'string', 'max:255'],
            'telegram_username' => ['nullable', 'string', 'max:255'],
            'monthly_fee' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'scholarship_amount' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'fee_status' => ['required', 'string', Rule::in(['paid', 'unpaid', 'partial'])],
            'status' => ['required', 'string', Rule::in(['active', 'inactive'])],
            'enrolled_on' => ['nullable', 'date'],
        ];
    }
}
