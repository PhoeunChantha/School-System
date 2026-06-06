<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

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

        if ($this->route('group') === 'mail') {
            return [
                'value' => ['required', 'array'],
                'value.mailHost' => ['required', 'string', 'max:255'],
                'value.mailPort' => ['required', 'integer', 'min:1', 'max:65535'],
                'value.mailScheme' => ['nullable', 'string', 'in:smtp,smtps'],
                'value.mailUsername' => ['required', 'email', 'max:255'],
                'value.mailPassword' => ['nullable', 'string', 'max:255'],
                'value.mailFromAddress' => ['required', 'email', 'max:255'],
            ];
        }

        if ($this->route('group') === 'login') {
            return [
                'value' => ['required', 'array'],
                'value.maxAttempts' => ['required', 'integer', 'min:1', 'max:20'],
                'value.decaySeconds' => ['required', 'integer', 'min:1', 'max:3600'],
                'value.alertEnabled' => ['required', 'boolean'],
                'value.alertEmail' => ['nullable', 'email', 'max:255'],
                'value.parentAccessEnabled' => ['required', 'boolean'],
                'value.parentAccessExpiresMinutes' => ['required', 'integer', 'min:1', 'max:60'],
                'value.parentSmsProvider' => ['required', 'string', 'in:plasgate'],
                'value.plasgateEndpoint' => ['required', 'url', 'max:255'],
                'value.plasgateSecret' => ['nullable', 'string', 'max:255'],
                'value.plasgatePrivate' => ['nullable', 'string', 'max:255'],
                'value.plasgateSender' => ['nullable', 'string', 'max:11'],
                'value.parentSmsTemplate' => ['required', 'string', 'max:320'],
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

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        if ($this->route('group') !== 'login') {
            return [];
        }

        return [
            function (Validator $validator): void {
                $endpoint = trim((string) $this->input('value.plasgateEndpoint'));

                if ($endpoint !== 'https://cloudapi.plasgate.com/rest/send') {
                    $validator->errors()->add(
                        'value.plasgateEndpoint',
                        'PlasGate API Keys must use https://cloudapi.plasgate.com/rest/send.',
                    );
                }
            },
        ];
    }
}
