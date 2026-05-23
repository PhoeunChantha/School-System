<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSchoolSettingRequest extends FormRequest
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
        if ($this->route('group') === 'database') {
            return [
                'value' => ['required', 'array'],
                'value.databaseName' => [
                    'required',
                    'string',
                    'max:64',
                    'regex:/^[A-Za-z0-9_.-]+$/',
                ],
            ];
        }

        return [
            'value' => ['required', 'array'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'value.databaseName.regex' => 'The database name may only contain letters, numbers, dots, underscores, and hyphens.',
        ];
    }
}
