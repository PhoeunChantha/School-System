<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLevelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $level = $this->route('level');

        return [
            'name'        => ['required', 'string', 'max:255', Rule::unique('levels', 'name')->ignore($level)->whereNull('deleted_at')],
            'monthly_fee' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
            'is_active'   => ['boolean'],
        ];
    }
}
