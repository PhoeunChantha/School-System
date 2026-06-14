<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TrackAppInstallationRequest extends FormRequest
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
     * @return array<string, array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'event' => ['required', Rule::in(['install_started', 'appinstalled', 'app_opened'])],
            'platform' => ['nullable', 'string', 'max:100'],
            'browser' => ['nullable', 'string', 'max:100'],
        ];
    }
}
