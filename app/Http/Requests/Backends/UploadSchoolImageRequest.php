<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UploadSchoolImageRequest extends FormRequest
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
        return [
            'type' => ['required', 'in:logo,favicon,loginBg,seoImage'],
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,gif,webp,svg', 'max:2048'],
        ];
    }
}
