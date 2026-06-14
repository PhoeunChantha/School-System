<?php

namespace App\Http\Requests\Backends;

use App\Models\AppInstallationLink;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAppInstallationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', AppInstallationLink::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'mode' => ['required', Rule::in(['individual', 'class'])],
            'audience' => ['required', Rule::in(['student', 'parent', 'both'])],
            'student_id' => ['nullable', 'required_if:mode,individual', 'integer', 'exists:students,id'],
            'class_id' => ['nullable', 'required_if:mode,class', 'integer', 'exists:school_classes,id'],
            'expires_days' => ['required', 'integer', 'min:1', 'max:90'],
        ];
    }
}
