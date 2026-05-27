<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UploadSearchConsoleFileRequest extends FormRequest
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
            'verification_file' => ['required', 'file', 'max:64'],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function ($validator): void {
                $file = $this->file('verification_file');

                if (! $file) {
                    return;
                }

                $contents = file_get_contents($file->getPathname()) ?: '';

                if (! preg_match('/google-site-verification:\s*google[a-z0-9]+\.html/i', $contents)) {
                    $validator->errors()->add(
                        'verification_file',
                        'Upload the HTML verification file downloaded from Google Search Console.',
                    );
                }
            },
        ];
    }
}
