<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFeeChargeRequest extends FormRequest
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
            'billing_month' => ['required', 'date'],
            'academic_year' => ['nullable', 'string', 'max:20'],
            'due_on' => ['nullable', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999.99'],
            'discount_amount' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'paid_amount' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'status' => ['required', 'string', Rule::in(['paid', 'unpaid', 'partial'])],
        ];
    }
}
