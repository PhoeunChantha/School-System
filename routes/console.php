<?php

use App\Console\Commands\SendAttendanceAlerts;
use App\Console\Commands\SendFeeReminders;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Send fee reminders every Monday at 8 AM
Schedule::command(SendFeeReminders::class)->weeklyOn(1, '08:00');

// Send attendance alerts every Friday at 3 PM
Schedule::command(SendAttendanceAlerts::class, ['--threshold=70'])->weeklyOn(5, '15:00');
