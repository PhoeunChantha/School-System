<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCertificateTemplateRequest extends FormRequest
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
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('certificate_templates', 'name')->ignore($this->route('certificateTemplate')),
            ],
            'template_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'logo_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_active' => ['sometimes', 'boolean'],
            'layout' => ['nullable', 'array'],
            'layout.heading' => ['nullable', 'string', 'max:255'],
            'layout.presented_to' => ['nullable', 'string', 'max:255'],
            'layout.body' => ['nullable', 'string', 'max:500'],
            'layout.grade' => ['nullable', 'string', 'max:255'],
            'layout.teacher_signature' => ['nullable', 'string', 'max:255'],
            'layout.director_signature' => ['nullable', 'string', 'max:255'],
            'layout.director_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
