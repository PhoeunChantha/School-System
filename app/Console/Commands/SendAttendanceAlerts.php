<?php

namespace App\Console\Commands;

use App\Jobs\SendTelegramMessage;
use App\Models\Student;
use App\Services\TelegramService;
use Illuminate\Console\Command;

class SendAttendanceAlerts extends Command
{
    protected $signature = 'telegram:attendance-alerts
                            {--threshold=70 : Attendance % below which to alert}
                            {--dry-run : Print messages without sending}';

    protected $description = 'Send Telegram attendance alerts to parents of students with low attendance';

    public function handle(TelegramService $telegram): int
    {
        if (! $telegram->isConfigured()) {
            $this->error('TELEGRAM_BOT_TOKEN is not configured in .env');

            return self::FAILURE;
        }

        $threshold = (int) $this->option('threshold');

        $students = Student::query()
            ->active()
            ->whereNotNull('parent_telegram_id')
            ->with('attendanceRecords:id,student_id,status')
            ->get(['id', 'name_en', 'name_kh', 'parent_telegram_id']);

        $sent = 0;
        $dryRun = $this->option('dry-run');

        foreach ($students as $student) {
            $total = $student->attendanceRecords->count();

            if ($total === 0) {
                continue;
            }

            $present = $student->attendanceRecords
                ->whereIn('status', ['present', 'late', 'excused'])
                ->count();

            $rate = (int) round(($present / $total) * 100);

            if ($rate >= $threshold) {
                continue;
            }

            $message = $telegram->attendanceAlertMessage($student->name_en, $rate);

            if ($dryRun) {
                $this->line("--- [{$student->name_en}] {$rate}% → {$student->parent_telegram_id} ---");
                $this->line($message);
                $this->newLine();
            } else {
                SendTelegramMessage::dispatch($student->parent_telegram_id, $message);
            }

            $sent++;
        }

        $action = $dryRun ? 'Would send' : 'Queued';
        $this->info("{$action} attendance alerts to {$sent} parent(s) below {$threshold}%.");

        return self::SUCCESS;
    }
}
