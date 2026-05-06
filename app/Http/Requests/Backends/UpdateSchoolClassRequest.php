<?php

namespace App\Http\Requests\Backends;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSchoolClassRequest extends FormRequest
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
        $schoolClass = $this->route('schoolClass');

        return [
            'level_id' => ['nullable', 'integer', Rule::exists('levels', 'id')],
            'teacher_id' => ['nullable', 'integer', Rule::exists('teachers', 'id')],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('school_classes')
                    ->ignore($schoolClass)
                    ->where(fn ($query) => $query
                        ->where('room', $this->string('room')->toString())
                        ->whereNull('deleted_at')),
            ],
            'room' => ['nullable', 'string', 'max:255'],
            'starts_at' => ['nullable', 'date_format:H:i'],
            'ends_at' => ['nullable', 'date_format:H:i'],
            'days' => ['nullable', 'array'],
            'days.*' => ['string', Rule::in(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:200'],
            'academic_year' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', Rule::in(['active', 'inactive'])],
        ];
    }
}
