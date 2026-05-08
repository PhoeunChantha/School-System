<?php

namespace App\Services\Backends;

use App\Models\SchoolClass;
use App\Models\Teacher;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TeacherService
{
    /**
     * @return array{teachers: mixed}
     */
    public function indexData(): array
    {
        return [
            'teachers' => Teacher::query()
                ->with(['schoolClasses' => fn ($query) => $query
                    ->withCount('students')
                    ->orderBy('name')])
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
                'id'           => $teacher->id,
                'nameKh'       => $teacher->name_kh,
                'nameEn'       => $teacher->name_en,
                'photo'        => $teacher->profile_photo ? asset($teacher->profile_photo) : null,
                'subject'      => $teacher->subject ?? '—',
                'phone'        => $teacher->phone,
                'telegram'     => $teacher->telegram_username,
                'status'       => $teacher->status,
                'totalClasses' => $teacher->schoolClasses->count(),
                'totalStudents' => $teacher->schoolClasses->sum('students_count'),
            ],
            'classes' => $teacher->schoolClasses->map(fn (SchoolClass $c) => [
                'id'       => $c->id,
                'name'     => $c->name,
                'room'     => $c->room ?? '—',
                'time'     => collect([$c->starts_at, $c->ends_at])->filter()->implode('–'),
                'days'     => implode(', ', array_map('ucfirst', $c->days ?? [])),
                'capacity' => $c->capacity,
                'count'    => $c->students_count,
                'students' => $c->students->map(fn ($s) => [
                    'id'     => $s->id,
                    'nameKh' => $s->name_kh,
                    'nameEn' => $s->name_en,
                    'photo'  => $s->profile_photo ? asset($s->profile_photo) : null,
                    'fees'   => match ($s->fee_status) { 'paid' => 'Paid', 'partial' => 'Partial', default => 'Unpaid' },
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
