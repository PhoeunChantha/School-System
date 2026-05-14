<?php

namespace App\Services\Backends;

use App\Models\SchoolClass;
use App\Models\Teacher;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TeacherService
{
    /**
     * @var array<int, string>
     */
    public const IMPORT_COLUMNS = [
        'name_kh',
        'name_en',
        'subject',
        'phone',
        'telegram_username',
        'status',
    ];

    /**
     * @return array{teachers: mixed}
     */
    public function indexData(): array
    {
        return [
            'teachers' => Teacher::query()
                ->with([
                    'lessonPlans' => fn ($query) => $query
                        ->with('schoolClass:id,name,room,starts_at,ends_at')
                        ->whereBetween('lesson_date', [today(), today()->addDay()])
                        ->orderBy('lesson_date')
                        ->orderBy('id'),
                    'schoolClasses' => fn ($query) => $query
                        ->withCount('students')
                        ->orderBy('name'),
                ])
                ->withCount('schoolClasses')
                ->orderBy('name_en')
                ->get()
                ->map(fn (Teacher $teacher): array => [
                    'id' => $teacher->id,
                    'nameKh' => $teacher->name_kh,
                    'nameEn' => $teacher->name_en,
                    'photo' => $teacher->profile_photo ? asset($teacher->profile_photo) : null,
                    'subject' => $teacher->subject ?? '',
                    'classes' => $teacher->school_classes_count,
                    'students' => $teacher->schoolClasses->sum('students_count'),
                    'phone' => $teacher->phone ?? '',
                    'telegramUsername' => $teacher->telegram_username,
                    'status' => $teacher->status,
                    'lessons' => $teacher->lessonPlans
                        ->map(fn ($lessonPlan): array => [
                            'id' => $lessonPlan->id,
                            'date' => $lessonPlan->lesson_date?->toDateString(),
                            'day' => $lessonPlan->lesson_date?->isToday() ? 'Today' : 'Tomorrow',
                            'title' => $lessonPlan->title,
                            'className' => $lessonPlan->schoolClass?->name ?? 'No class',
                            'room' => $lessonPlan->schoolClass?->room ?? '',
                            'time' => collect([$lessonPlan->schoolClass?->starts_at, $lessonPlan->schoolClass?->ends_at])->filter()->implode('-'),
                            'objective' => $lessonPlan->objective ?? '',
                            'status' => $lessonPlan->status,
                        ])
                        ->values(),
                    'schedule' => $teacher->schoolClasses
                        ->map(fn (SchoolClass $schoolClass): array => [
                            'id' => $schoolClass->id,
                            'name' => $schoolClass->name,
                            'time' => collect([$schoolClass->starts_at, $schoolClass->ends_at])->filter()->implode('-'),
                            'room' => $schoolClass->room ?? '',
                            'count' => $schoolClass->students_count,
                            'days' => implode(' ', $schoolClass->days ?? []),
                        ])
                        ->values(),
                ]),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function showData(Teacher $teacher): array
    {
        $teacher->load([
            'schoolClasses' => fn ($q) => $q
                ->withCount('students')
                ->with(['students:id,school_class_id,name_kh,name_en,profile_photo,fee_status,status'])
                ->orderBy('name'),
        ]);

        return [
            'teacher' => [
                'id' => $teacher->id,
                'nameKh' => $teacher->name_kh,
                'nameEn' => $teacher->name_en,
                'photo' => $teacher->profile_photo ? asset($teacher->profile_photo) : null,
                'subject' => $teacher->subject ?? '—',
                'phone' => $teacher->phone,
                'telegram' => $teacher->telegram_username,
                'status' => $teacher->status,
                'totalClasses' => $teacher->schoolClasses->count(),
                'totalStudents' => $teacher->schoolClasses->sum('students_count'),
            ],
            'classes' => $teacher->schoolClasses->map(fn (SchoolClass $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'room' => $c->room ?? '—',
                'time' => collect([$c->starts_at, $c->ends_at])->filter()->implode('–'),
                'days' => implode(', ', array_map('ucfirst', $c->days ?? [])),
                'capacity' => $c->capacity,
                'count' => $c->students_count,
                'students' => $c->students->map(fn ($s) => [
                    'id' => $s->id,
                    'nameKh' => $s->name_kh,
                    'nameEn' => $s->name_en,
                    'photo' => $s->profile_photo ? asset($s->profile_photo) : null,
                    'fees' => match ($s->fee_status) {
                        'paid' => 'Paid', 'partial' => 'Partial', default => 'Unpaid'
                    },
                    'status' => $s->status,
                ])->all(),
            ])->all(),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): Teacher
    {
        $photoPath = $this->storePhoto($data['profile_photo'] ?? null);

        return DB::transaction(fn (): Teacher => Teacher::create([
            ...$this->normalizedData($data),
            'profile_photo' => $photoPath,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Teacher $teacher, array $data, ?int $userId): Teacher
    {
        $photoPath = $teacher->profile_photo;

        if (isset($data['profile_photo']) && $data['profile_photo'] instanceof UploadedFile) {
            $this->deletePhoto($teacher->profile_photo);
            $photoPath = $this->storePhoto($data['profile_photo']);
        }

        return DB::transaction(function () use ($teacher, $data, $userId, $photoPath): Teacher {
            $teacher->update([
                ...$this->normalizedData($data),
                'profile_photo' => $photoPath,
                'updated_by' => $userId,
            ]);

            return $teacher->refresh();
        });
    }

    public function delete(Teacher $teacher, ?int $userId): void
    {
        DB::transaction(function () use ($teacher, $userId): void {
            $teacher->update([
                'updated_by' => $userId,
            ]);

            $teacher->delete();
        });
    }

    /**
     * @return array{created: int, updated: int, skipped: int}
     */
    public function import(UploadedFile $file, ?int $userId): array
    {
        $summary = ['created' => 0, 'updated' => 0, 'skipped' => 0];

        foreach ($this->csvRows($file) as $row) {
            $data = [
                'name_kh' => $this->emptyToNull($row['name_kh'] ?? null),
                'name_en' => $this->emptyToNull($row['name_en'] ?? null),
                'subject' => $this->emptyToNull($row['subject'] ?? null),
                'phone' => $this->emptyToNull($row['phone'] ?? null),
                'telegram_username' => $this->emptyToNull($row['telegram_username'] ?? null),
                'status' => Str::lower((string) ($this->emptyToNull($row['status'] ?? null) ?? 'active')),
            ];

            $validator = Validator::make($data, [
                'name_kh' => ['required', 'string', 'max:255'],
                'name_en' => ['required', 'string', 'max:255'],
                'subject' => ['nullable', 'string', 'max:255'],
                'phone' => ['nullable', 'string', 'max:255'],
                'telegram_username' => ['nullable', 'string', 'max:255'],
                'status' => ['required', 'string', Rule::in(['active', 'inactive'])],
            ]);

            if ($validator->fails()) {
                $summary['skipped']++;

                continue;
            }

            DB::transaction(function () use ($data, $userId, &$summary): void {
                $teacher = Teacher::query()
                    ->withTrashed()
                    ->where('name_en', $data['name_en'])
                    ->first();

                if ($teacher) {
                    $teacher->restore();
                    $teacher->update([
                        ...$this->normalizedData($data),
                        'updated_by' => $userId,
                    ]);
                    $summary['updated']++;

                    return;
                }

                Teacher::create([
                    ...$this->normalizedData($data),
                    'created_by' => $userId,
                    'updated_by' => $userId,
                ]);
                $summary['created']++;
            });
        }

        return $summary;
    }

    /**
     * @return array<int, array<int, mixed>>
     */
    public function exportRows(): array
    {
        return Teacher::query()
            ->orderBy('name_en')
            ->get()
            ->map(fn (Teacher $teacher): array => [
                $teacher->name_kh,
                $teacher->name_en,
                $teacher->subject,
                $teacher->phone,
                $teacher->telegram_username,
                $teacher->status,
            ])
            ->all();
    }

    private function storePhoto(?UploadedFile $file): ?string
    {
        if (! $file) {
            return null;
        }

        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $destination = public_path('uploads/teachers');

        if (! is_dir($destination)) {
            mkdir($destination, 0755, true);
        }

        $file->move($destination, $filename);

        return 'uploads/teachers/'.$filename;
    }

    /**
     * @return iterable<array<string, string>>
     */
    private function csvRows(UploadedFile $file): iterable
    {
        $handle = fopen($file->getRealPath(), 'r');

        if ($handle === false) {
            return;
        }

        $headers = null;

        while (($row = fgetcsv($handle)) !== false) {
            if ($row === [null] || $row === false) {
                continue;
            }

            if ($headers === null) {
                $headers = array_map(fn (string $header): string => Str::of($header)->trim()->lower()->replace(' ', '_')->toString(), $row);

                continue;
            }

            yield array_combine($headers, array_pad($row, count($headers), '')) ?: [];
        }

        fclose($handle);
    }

    private function emptyToNull(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function deletePhoto(?string $path): void
    {
        if ($path && file_exists(public_path($path))) {
            unlink(public_path($path));
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizedData(array $data): array
    {
        unset($data['profile_photo']);

        return $data;
    }
}
