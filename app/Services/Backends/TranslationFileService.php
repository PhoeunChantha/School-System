<?php

namespace App\Services\Backends;

use App\Models\ActivityLog;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\File;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class TranslationFileService
{
    /** @var array<int, string> */
    private const LOCALES = ['en', 'kh'];

    /**
     * @return array{groups: array<int, array{value: string, label: string, count: int}>, entries: array<int, array{group: string, key: string, en: string, kh: string}>, summary: array{total: int, complete: int, missingEn: int, missingKh: int}}
     */
    public function indexData(): array
    {
        $groups = $this->groups();
        $entries = collect($groups)
            ->flatMap(function (string $group): array {
                $translations = collect(self::LOCALES)
                    ->mapWithKeys(fn (string $locale): array => [
                        $locale => collect(Arr::dot($this->read($locale, $group)))
                            ->filter(fn (mixed $value): bool => is_scalar($value) || $value === null)
                            ->all(),
                    ]);
                $english = $translations->get('en', []);
                $khmer = $translations->get('kh', []);

                return collect(array_keys($english))
                    ->merge(array_keys($khmer))
                    ->unique()
                    ->sort()
                    ->map(fn (string $key): array => [
                        'group' => $group,
                        'key' => $key,
                        'en' => (string) ($english[$key] ?? ''),
                        'kh' => (string) ($khmer[$key] ?? ''),
                    ])
                    ->values()
                    ->all();
            })
            ->values();

        return [
            'groups' => collect($groups)->map(fn (string $group): array => [
                'value' => $group,
                'label' => str($group)->headline()->toString(),
                'count' => $entries->where('group', $group)->count(),
            ])->values()->all(),
            'entries' => $entries->all(),
            'summary' => [
                'total' => $entries->count(),
                'complete' => $entries->filter(fn (array $entry): bool => filled($entry['en']) && filled($entry['kh']))->count(),
                'missingEn' => $entries->where('en', '')->count(),
                'missingKh' => $entries->where('kh', '')->count(),
            ],
        ];
    }

    /** @param array{group: string, key: string, en: string, kh: string} $data */
    public function create(array $data): void
    {
        $this->ensureSupportedGroup($data['group']);

        foreach (self::LOCALES as $locale) {
            $translations = $this->read($locale, $data['group']);

            if (Arr::has($translations, $data['key'])) {
                throw ValidationException::withMessages(['key' => 'This translation key already exists.']);
            }

            $this->ensureParentKeysAreArrays($translations, $data['key']);
        }

        $this->writePair($data['group'], $data['key'], $data['en'], $data['kh']);
        $this->recordActivity('translation_created', $data['group'], $data['key']);
    }

    /** @param array{en: string, kh: string} $data */
    public function update(string $group, string $key, array $data): void
    {
        $this->ensureSupportedGroup($group);
        abort_unless($this->exists($group, $key), 404);

        $this->writePair($group, $key, $data['en'], $data['kh']);
        $this->recordActivity('translation_updated', $group, $key);
    }

    public function delete(string $group, string $key): void
    {
        $this->ensureSupportedGroup($group);
        abort_unless($this->exists($group, $key), 404);

        $translations = collect(self::LOCALES)->mapWithKeys(function (string $locale) use ($group, $key): array {
            $values = $this->read($locale, $group);
            Arr::forget($values, $key);

            return [$locale => $values];
        })->all();

        $this->persist($group, $translations);
        $this->recordActivity('translation_deleted', $group, $key);
    }

    /** @return array<int, string> */
    public function groups(): array
    {
        return collect(self::LOCALES)
            ->flatMap(fn (string $locale) => File::glob(lang_path("{$locale}/*.php")))
            ->map(fn (string $path): string => pathinfo($path, PATHINFO_FILENAME))
            ->filter(fn (string $group): bool => preg_match('/^[A-Za-z0-9_-]+$/', $group) === 1)
            ->unique()
            ->sort()
            ->values()
            ->all();
    }

    private function exists(string $group, string $key): bool
    {
        return collect(self::LOCALES)->contains(
            fn (string $locale): bool => Arr::has($this->read($locale, $group), $key),
        );
    }

    private function ensureSupportedGroup(string $group): void
    {
        abort_unless(in_array($group, $this->groups(), true), 404);
    }

    /** @return array<string, mixed> */
    private function read(string $locale, string $group): array
    {
        $path = $this->path($locale, $group);

        if (! File::exists($path)) {
            return [];
        }

        $translations = require $path;

        if (! is_array($translations)) {
            throw new RuntimeException("Translation file [{$path}] must return an array.");
        }

        return $translations;
    }

    private function writePair(string $group, string $key, string $english, string $khmer): void
    {
        $translations = [];

        foreach (['en' => $english, 'kh' => $khmer] as $locale => $value) {
            $translations[$locale] = $this->read($locale, $group);
            Arr::set($translations[$locale], $key, $value);
        }

        $this->persist($group, $translations);
    }

    /** @param array<string, mixed> $translations */
    private function ensureParentKeysAreArrays(array $translations, string $key): void
    {
        $segments = explode('.', $key);
        array_pop($segments);
        $parentKey = '';

        foreach ($segments as $segment) {
            $parentKey = $parentKey === '' ? $segment : "{$parentKey}.{$segment}";

            if (Arr::has($translations, $parentKey) && ! is_array(Arr::get($translations, $parentKey))) {
                throw ValidationException::withMessages([
                    'key' => "The parent translation key [{$parentKey}] already contains text.",
                ]);
            }
        }
    }

    /** @param array<string, array<string, mixed>> $translations */
    private function persist(string $group, array $translations): void
    {
        $originals = [];

        foreach (self::LOCALES as $locale) {
            $path = $this->path($locale, $group);
            $originals[$path] = File::exists($path) ? File::get($path) : null;
        }

        try {
            foreach (self::LOCALES as $locale) {
                $path = $this->path($locale, $group);
                File::ensureDirectoryExists(dirname($path));

                if (File::put($path, "<?php\n\nreturn ".$this->exportArray($translations[$locale] ?? []).";\n", true) === false) {
                    throw new RuntimeException("Unable to write translation file [{$path}].");
                }
            }
        } catch (\Throwable $exception) {
            foreach ($originals as $path => $content) {
                $content === null ? File::delete($path) : File::put($path, $content, true);
            }

            throw $exception;
        }
    }

    /** @param array<string|int, mixed> $values */
    private function exportArray(array $values, int $depth = 0): string
    {
        if ($values === []) {
            return '[]';
        }

        $indent = str_repeat('    ', $depth);
        $childIndent = str_repeat('    ', $depth + 1);
        $lines = collect($values)->map(function (mixed $value, string|int $key) use ($depth, $childIndent): string {
            $exportedValue = is_array($value) ? $this->exportArray($value, $depth + 1) : var_export($value, true);

            return $childIndent.var_export($key, true).' => '.$exportedValue.',';
        })->implode("\n");

        return "[\n{$lines}\n{$indent}]";
    }

    private function path(string $locale, string $group): string
    {
        return lang_path("{$locale}/{$group}.php");
    }

    private function recordActivity(string $event, string $group, string $key): void
    {
        ActivityLog::query()->create([
            'user_id' => auth()->id(),
            'event' => $event,
            'description' => str($event)->replace('_', ' ')->headline()->append(": {$group}.{$key}")->toString(),
            'properties' => ['group' => $group, 'key' => $key],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
