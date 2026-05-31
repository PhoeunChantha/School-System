<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Minishlink\WebPush\VAPID;

class GenerateWebPushKeys extends Command
{
    protected $signature = 'webpush:generate-keys
                            {--show : Print keys without updating .env}';

    protected $description = 'Generate VAPID keys for browser Web Push notifications';

    public function handle(): int
    {
        $keys = VAPID::createVapidKeys();

        $publicKey = $keys['publicKey'];
        $privateKey = $keys['privateKey'];

        $this->line('WEB_PUSH_PUBLIC_KEY='.$publicKey);
        $this->line('WEB_PUSH_PRIVATE_KEY='.$privateKey);

        if ($this->option('show')) {
            return self::SUCCESS;
        }

        $this->updateEnvironmentFile('WEB_PUSH_PUBLIC_KEY', $publicKey);
        $this->updateEnvironmentFile('WEB_PUSH_PRIVATE_KEY', $privateKey);

        $this->info('Web Push VAPID keys written to .env.');

        return self::SUCCESS;
    }

    private function updateEnvironmentFile(string $key, string $value): void
    {
        $path = base_path('.env');
        $contents = File::exists($path) ? File::get($path) : '';
        $line = $key.'='.$value;

        if (preg_match('/^'.preg_quote($key, '/').'=.*$/m', $contents)) {
            $contents = preg_replace('/^'.preg_quote($key, '/').'=.*$/m', $line, $contents) ?? $contents;
        } else {
            $contents = rtrim($contents, "\r\n").PHP_EOL.$line.PHP_EOL;
        }

        File::put($path, $contents);
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function opensslConfigPath(): ?string
    {
        $configuredPath = getenv('OPENSSL_CONF');

        if (is_string($configuredPath) && File::exists($configuredPath)) {
            return $configuredPath;
        }

        $windowsPath = PHP_BINARY
            ? dirname(PHP_BINARY).DIRECTORY_SEPARATOR.'extras'.DIRECTORY_SEPARATOR.'ssl'.DIRECTORY_SEPARATOR.'openssl.cnf'
            : null;

        return $windowsPath && File::exists($windowsPath) ? $windowsPath : null;
    }
}
