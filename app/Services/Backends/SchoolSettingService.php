<?php

namespace App\Services\Backends;

use App\Models\Level;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SchoolSettingService
{
    public const GROUP_KEYS = [
        'school' => 'profile',
        'fees' => 'policy',
        'classes' => 'schedule',
        'notifications' => 'preferences',
    ];

    /**
     * @return array{settings: array<string, mixed>, levels: mixed, classes: mixed}
     */
    public function indexData(): array
    {
        return [
            'settings' => [
                'school' => $this->settingValue('school'),
                'fees' => $this->settingValue('fees'),
                'classes' => $this->settingValue('classes'),
                'notifications' => $this->settingValue('notifications'),
            ],
            'levels' => Level::query()
                ->active()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'monthly_fee'])
                ->map(fn (Level $level): array => [
                    'id' => $level->id,
                    'name' => $level->name,
                    'monthlyFee' => (float) $level->monthly_fee,
                ]),
            'classes' => SchoolClass::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name', 'room', 'starts_at', 'ends_at', 'days'])
                ->map(fn (SchoolClass $schoolClass): array => [
                    'id' => $schoolClass->id,
                    'name' => $schoolClass->name,
                    'room' => $schoolClass->room ?? '',
                    'startsAt' => $schoolClass->starts_at ?? '',
                    'endsAt' => $schoolClass->ends_at ?? '',
                    'days' => implode(' ', $schoolClass->days ?? []),
                ]),
        ];
    }

    /**
     * @param  array<string, mixed>  $value
     */
    public function update(string $group, array $value, ?int $userId): SchoolSetting
    {
        if (! array_key_exists($group, self::GROUP_KEYS)) {
            throw new InvalidArgumentException('Unknown settings group.');
        }

        return DB::transaction(function () use ($group, $userId, $value): SchoolSetting {
            $setting = SchoolSetting::query()->firstOrNew([
                'group' => $group,
                'key' => self::GROUP_KEYS[$group],
            ]);

            $setting->fill([
                'value' => $value,
                'updated_by' => $userId,
            ]);

            if (! $setting->exists) {
                $setting->created_by = $userId;
            }

            $setting->save();

            return $setting;
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function settingValue(string $group): array
    {
        $setting = SchoolSetting::query()
            ->where('group', $group)
            ->where('key', self::GROUP_KEYS[$group])
            ->first();

        return array_replace_recursive($this->defaults($group), $setting?->value ?? []);
    }

    /**
     * Move an uploaded image to public/uploads/school/, delete the old file, and
     * merge the new path into the saved school settings.
     */
    public function uploadImage(string $type, \Illuminate\Http\UploadedFile $file, ?int $userId): string
    {
        $destination = public_path('uploads/school');

        if (! is_dir($destination)) {
            mkdir($destination, 0755, true);
        }

        $current = $this->settingValue('school');

        // Remove old file if it exists
        if (! empty($current[$type])) {
            $oldPath = public_path($current[$type]);

            if (file_exists($oldPath)) {
                @unlink($oldPath);
            }
        }

        $ext = $file->getClientOriginalExtension() ?: 'png';
        $filename = $type.'_'.time().'.'.$ext;
        $file->move($destination, $filename);

        $path = 'uploads/school/'.$filename;
        $current[$type] = $path;

        $this->update('school', $current, $userId);

        return $path;
    }

    /**
     * @return array<string, mixed>
     */
    private function defaults(string $group): array
    {
        return match ($group) {
            'school' => [
                'nameKh' => 'សាលា Frania',
                'nameEn' => 'Frania English School',
                'address' => 'Phnom Penh, Cambodia',
                'phone' => '023-123-456',
                'email' => 'info@frania.edu.kh',
                'telegram' => '@frania_school',
                'principal' => 'Mr. Vuthy',
                'founded' => '2018',
                'logo' => null,
                'favicon' => null,
            ],
            'fees' => [
                'levelFees' => Level::query()
                    ->active()
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get(['name', 'monthly_fee'])
                    ->map(fn (Level $level): array => [
                        'level' => $level->name,
                        'fee' => (float) $level->monthly_fee,
                    ])
                    ->values()
                    ->all(),
                'lateFee' => '5',
                'dueDay' => '5',
            ],
            'classes' => [
                'schedule' => SchoolClass::query()
                    ->active()
                    ->orderBy('name')
                    ->get(['name', 'room', 'starts_at', 'ends_at', 'days'])
                    ->map(fn (SchoolClass $schoolClass): array => [
                        'label' => $schoolClass->name,
                        'time' => trim(($schoolClass->starts_at ?? '').' - '.($schoolClass->ends_at ?? '')),
                        'room' => $schoolClass->room ?? '',
                        'days' => implode(' ', $schoolClass->days ?? []),
                    ])
                    ->values()
                    ->all(),
            ],
            'notifications' => [
                'attendanceAlert' => true,
                'lowAttendanceThreshold' => '70',
                'feeReminder' => true,
                'feeReminderDays' => '3',
                'homeworkDue' => true,
                'systemUpdates' => true,
            ],
            default => [],
        };
    }
}
