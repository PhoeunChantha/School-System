<?php

namespace Tests\Feature;

use Illuminate\Support\Arr;
use Tests\TestCase;

class AdminTranslationKeysTest extends TestCase
{
    public function test_admin_translation_files_have_matching_keys(): void
    {
        $englishKeys = array_keys(Arr::dot(require lang_path('en/admin.php')));
        $khmerKeys = array_keys(Arr::dot(require lang_path('kh/admin.php')));

        sort($englishKeys);
        sort($khmerKeys);

        $this->assertSame($englishKeys, $khmerKeys);
    }
}
