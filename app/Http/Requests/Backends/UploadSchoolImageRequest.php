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
            'type' => ['required', 'in:logo,favicon,loginBg,seoImage,notificationSound'],
            'image' => [
                'required',
                'file',
                'max:5120',
                $this->input('type') === 'notificationSound'
                    ? 'mimes:mp3,wav,ogg'
                    : 'image|mimes:jpg,jpeg,png,gif,webp,svg',
            ],
        ];
    }
}
