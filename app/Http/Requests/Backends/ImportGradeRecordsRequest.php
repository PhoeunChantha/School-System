<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class ImportGradeRecordsRequest extends FormRequest
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
            'import_file' => ['required', File::types(['csv', 'txt'])->max(5 * 1024)],
        ];
    }
}
