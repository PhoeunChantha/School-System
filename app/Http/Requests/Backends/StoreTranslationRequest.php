<?php

namespace App\Http\Requests\Backends;

use App\Services\Backends\TranslationFileService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTranslationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('translations.create') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'group' => ['required', 'string', Rule::in(app(TranslationFileService::class)->groups())],
            'key' => ['required', 'string', 'max:180', 'regex:/^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/'],
            'en' => ['required', 'string', 'max:5000'],
            'kh' => ['required', 'string', 'max:5000'],
        ];
    }
}
