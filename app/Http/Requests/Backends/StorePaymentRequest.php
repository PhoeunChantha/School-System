<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
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
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999.99'],
            'method' => ['required', 'string', Rule::in(['cash', 'aba', 'acleda', 'wing', 'bank'])],
            'status' => ['required', 'string', Rule::in(['pending', 'paid', 'verified'])],
            'paid_on' => ['required', 'date'],
            'billing_month' => ['required', 'date'],
            'reference' => ['nullable', 'string', 'max:255'],
            'screenshot_path' => ['nullable', 'string', 'max:255'],
        ];
    }
}
