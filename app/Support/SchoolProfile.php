<?php

namespace App\Support;

use App\Models\SchoolSetting;
use Illuminate\Support\Arr;

class SchoolProfile
{
    /**
     * @return array{nameEn: string, logo: string|null, favicon: string|null, loginBg: string|null, logoPath: string|null, faviconPath: string|null}
     */
    public function data(): array
    {
        $value = SchoolSetting::query()
            ->where('group', 'school')
            ->where('key', 'profile')
            ->value('value') ?? [];

        $logoPath = $this->localPublicPath(Arr::get($value, 'logo'));
        $faviconPath = $this->localPublicPath(Arr::get($value, 'favicon'));
        $loginBackgroundPath = $this->localPublicPath(Arr::get($value, 'loginBg'));

        return [
            'nameEn' => filled(Arr::get($value, 'nameEn')) ? (string) Arr::get($value, 'nameEn') : 'Frania English School',
            'logo' => $logoPath ? asset($logoPath) : null,
            'favicon' => $faviconPath ? asset($faviconPath) : null,
            'loginBg' => $loginBackgroundPath ? asset($loginBackgroundPath) : null,
            'logoPath' => $logoPath,
            'faviconPath' => $faviconPath,
        ];
    }

    /**
     * @return array<int, array{src: string, sizes: string, type: string, purpose: string}>
     */
    public function pwaIcons(): array
    {
        $data = $this->data();
        $paths = collect([$data['logoPath'], $data['faviconPath']])->filter()->unique();

        if ($paths->isEmpty()) {
            $paths->push('frania.png');
        }

        return $paths
            ->map(fn (string $path): array => [
                'src' => asset($path),
                'sizes' => $this->imageSizes($path),
                'type' => $this->imageMimeType($path),
                'purpose' => 'any maskable',
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
    public function pwaCachePaths(): array
    {
        $data = $this->data();
        $paths = collect([$data['logoPath'], $data['faviconPath']])->filter();

        if ($paths->isEmpty()) {
            $paths->push('frania.png');
        }

        return $paths
            ->map(fn (string $path): string => '/'.ltrim($path, '/'))
            ->unique()
            ->values()
            ->all();
    }

    private function localPublicPath(mixed $path): ?string
    {
        if (! is_string($path) || blank($path)) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return null;
        }

        return ltrim($path, '/');
    }

    private function imageSizes(string $path): string
    {
        $absolutePath = public_path($path);

        if (! is_file($absolutePath)) {
            return 'any';
        }

        $size = getimagesize($absolutePath);

        if ($size === false) {
            return 'any';
        }

        return "{$size[0]}x{$size[1]}";
    }

    private function imageMimeType(string $path): string
    {
        return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'svg' => 'image/svg+xml',
            'jpg', 'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'ico' => 'image/x-icon',
            default => 'image/png',
        };
    }
}
