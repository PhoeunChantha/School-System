<?php

namespace App\Http\Requests\Backends;

use App\Models\AttendanceSession;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttendanceSessionRequest extends FormRequest
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
        $session = $this->route('attendanceSession');
        $sessionId = $session instanceof AttendanceSession ? $session->getKey() : $session;

        return [
            'school_class_id' => ['required', 'integer', Rule::exists('school_classes', 'id')->whereNull('deleted_at')],
            'attendance_date' => ['required', 'date'],
            'period' => [
                'required',
                'string',
                Rule::in(['morning', 'afternoon', 'evening', 'full_day']),
                Rule::unique('attendance_sessions', 'period')
                    ->where('school_class_id', $this->integer('school_class_id'))
                    ->where('attendance_date', $this->input('attendance_date'))
                    ->ignore($sessionId),
            ],
            'records' => ['required', 'array', 'min:1'],
            'records.*.student_id' => ['required', 'integer', Rule::exists('students', 'id')->whereNull('deleted_at')],
            'records.*.status' => ['required', 'string', Rule::in(['present', 'absent', 'late', 'excused'])],
            'records.*.note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
