<?php

namespace App\Services\Backends;

use App\Models\Level;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use InvalidArgumentException;

class SchoolSettingService
{
    public const GROUP_KEYS = [
        'school' => 'profile',
        'seo' => 'meta',
        'fees' => 'policy',
        'classes' => 'schedule',
        'notifications' => 'preferences',
    ];

    public function __construct(private readonly ?string $environmentPath = null) {}

    /**
     * @return array{settings: array<string, mixed>, levels: mixed, classes: mixed}
     */
    public function indexData(): array
    {
        return [
            'settings' => [
                'school' => $this->settingValue('school'),
                'seo' => $this->settingValue('seo'),
                'fees' => $this->settingValue('fees'),
                'classes' => $this->settingValue('classes'),
                'notifications' => $this->settingValue('notifications'),
                'database' => [
                    'databaseName' => $this->environmentValue('DB_DATABASE')
                        ?? (string) config('database.connections.'.config('database.default').'.database', ''),
                ],
                'searchConsole' => [
                    'verificationFile' => $this->searchConsoleVerificationFile(),
                    'verificationUrl' => $this->searchConsoleVerificationUrl(),
                ],
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
        if ($group === 'database') {
            $this->updateDatabaseName((string) ($value['databaseName'] ?? ''));

            return new SchoolSetting([
                'group' => 'database',
                'key' => 'environment',
                'value' => ['databaseName' => $value['databaseName'] ?? ''],
                'updated_by' => $userId,
            ]);
        }

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

    public function updateDatabaseName(string $databaseName): void
    {
        $databaseName = trim($databaseName);

        if ($databaseName === '') {
            throw new InvalidArgumentException('Database name is required.');
        }

        if (! $this->databaseExists($databaseName)) {
            throw new InvalidArgumentException("Database [{$databaseName}] does not exist.");
        }

        $path = $this->environmentFilePath();
        $contents = File::exists($path) ? File::get($path) : '';
        $line = 'DB_DATABASE='.$this->formatEnvironmentValue($databaseName);

        if (preg_match('/^DB_DATABASE=.*$/m', $contents)) {
            $contents = preg_replace('/^DB_DATABASE=.*$/m', $line, $contents) ?? $contents;
        } else {
            $contents = rtrim($contents, "\r\n").PHP_EOL.$line.PHP_EOL;
        }

        File::put($path, $contents);

        Artisan::call('config:clear');
    }

    private function environmentFilePath(): string
    {
        return $this->environmentPath ?? base_path('.env');
    }

    private function environmentValue(string $key): ?string
    {
        $path = $this->environmentFilePath();

        if (! File::exists($path)) {
            return null;
        }

        $contents = File::get($path);

        if (! preg_match('/^'.preg_quote($key, '/').'=(.*)$/m', $contents, $matches)) {
            return null;
        }

        return trim($matches[1], " \t\n\r\0\x0B\"'");
    }

    private function formatEnvironmentValue(string $value): string
    {
        if (preg_match('/^[A-Za-z0-9_.-]+$/', $value)) {
            return $value;
        }

        return '"'.str_replace('"', '\"', $value).'"';
    }

    private function databaseExists(string $databaseName): bool
    {
        if (config('database.connections.'.config('database.default').'.driver') !== 'mysql') {
            return true;
        }

        try {
            return DB::selectOne(
                'select schema_name from information_schema.schemata where schema_name = ? limit 1',
                [$databaseName],
            ) !== null;
        } catch (\Throwable) {
            return false;
        }
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
    public function uploadImage(string $type, UploadedFile $file, ?int $userId): string
    {
        $destination = public_path('uploads/school');

        if (! is_dir($destination)) {
            mkdir($destination, 0755, true);
        }

        $group = $type === 'seoImage' ? 'seo' : 'school';
        $current = $this->settingValue($group);

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

        $this->update($group, $current, $userId);

        return $path;
    }

    public function uploadSearchConsoleFile(UploadedFile $file): string
    {
        $filename = $file->getClientOriginalName();

        if (! preg_match('/^google[a-z0-9]+\.html$/i', $filename)) {
            throw new InvalidArgumentException('Invalid Google Search Console verification file.');
        }

        foreach (glob(public_path('google*.html')) ?: [] as $existingFile) {
            if (basename($existingFile) !== $filename && is_file($existingFile)) {
                @unlink($existingFile);
            }
        }

        $file->move(public_path(), $filename);

        return $filename;
    }

    private function searchConsoleVerificationFile(): ?string
    {
        $files = glob(public_path('google*.html')) ?: [];

        if ($files === []) {
            return null;
        }

        usort($files, fn (string $left, string $right): int => filemtime($right) <=> filemtime($left));

        return basename($files[0]);
    }

    private function searchConsoleVerificationUrl(): ?string
    {
        $filename = $this->searchConsoleVerificationFile();

        if (! $filename) {
            return null;
        }

        return url($filename);
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
                'loginBg' => null,
            ],
            'seo' => [
                'title' => 'Frania English School',
                'description' => 'Frania English School - Cambodia school management system.',
                'keywords' => 'Frania English School, Cambodia school, English school',
                'canonicalUrl' => '',
                'robots' => 'index,follow',
                'seoImage' => null,
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
