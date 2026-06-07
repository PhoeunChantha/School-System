<?php

namespace App\Http\Requests\Backends;

use App\Models\GradePeriod;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGradePeriodRequest extends FormRequest
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
        $gradePeriod = $this->route('gradePeriod');
        $gradePeriodId = $gradePeriod instanceof GradePeriod ? $gradePeriod->id : null;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('grade_periods', 'name')
                    ->ignore($gradePeriodId)
                    ->where('type', $this->string('type')->toString())
                    ->where('academic_year', $this->string('academic_year')->toString()),
            ],
            'type' => ['required', 'string', Rule::in(['monthly', 'term', 'final'])],
            'academic_year' => ['required', 'string', 'max:20'],
            'starts_on' => ['nullable', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'is_current' => ['boolean'],
        ];
    }
}
