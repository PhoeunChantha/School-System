<?php

namespace Database\Seeders;

use App\Models\SchoolSetting;
use App\Services\Backends\SchoolSettingService;
use Illuminate\Database\Seeder;

class SchoolSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'group' => 'school',
                'key'   => SchoolSettingService::GROUP_KEYS['school'],
                'value' => [
                    'nameKh'    => 'សាលា Frania',
                    'nameEn'    => 'Frania English School',
                    'address'   => 'No. 123, Street 271, Sangkat Tuol Tumpung, Khan Chamkarmon, Phnom Penh',
                    'phone'     => '023-555-123',
                    'email'     => 'info@frania.edu.kh',
                    'telegram'  => '@frania_school',
                    'principal' => 'Mr. Vuthy Sok',
                    'founded'   => '2018',
                ],
            ],
            [
                'group' => 'fees',
                'key'   => SchoolSettingService::GROUP_KEYS['fees'],
                'value' => [
                    'levelFees' => [
                        ['level' => 'Beginner 1',         'fee' => 25],
                        ['level' => 'Beginner 2',         'fee' => 25],
                        ['level' => 'Elementary',         'fee' => 30],
                        ['level' => 'Pre-Intermediate',   'fee' => 35],
                        ['level' => 'Intermediate',       'fee' => 40],
                        ['level' => 'Upper-Intermediate', 'fee' => 45],
                        ['level' => 'Advanced',           'fee' => 50],
                    ],
                    'lateFee' => '5',
                    'dueDay'  => '5',
                ],
            ],
            [
                'group' => 'notifications',
                'key'   => SchoolSettingService::GROUP_KEYS['notifications'],
                'value' => [
                    'attendanceAlert'        => true,
                    'lowAttendanceThreshold' => '70',
                    'feeReminder'            => true,
                    'feeReminderDays'        => '3',
                    'homeworkDue'            => true,
                    'systemUpdates'          => true,
                ],
            ],
        ];

        foreach ($settings as $data) {
            SchoolSetting::updateOrCreate(
                ['group' => $data['group'], 'key' => $data['key']],
                ['value' => $data['value']]
            );
        }
    }
}
