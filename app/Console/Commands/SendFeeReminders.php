<?php

namespace App\Console\Commands;

use App\Jobs\SendTelegramMessage;
use App\Models\Student;
use App\Services\TelegramService;
use Illuminate\Console\Command;

class SendFeeReminders extends Command
{
    protected $signature = 'telegram:fee-reminders
                            {--dry-run : Print messages without sending}';

    protected $description = 'Send Telegram fee reminder to parents of students with unpaid fees';

    public function handle(TelegramService $telegram): int
    {
        if (! $telegram->isConfigured()) {
            $this->error('TELEGRAM_BOT_TOKEN is not configured in .env');

            return self::FAILURE;
        }

        $students = Student::query()
            ->active()
            ->whereNotNull('parent_telegram_id')
            ->where('fee_status', 'unpaid')
            ->with('feeCharges:id,student_id,billing_month,amount,status')
            ->get(['id', 'name_en', 'name_kh', 'parent_telegram_id', 'monthly_fee', 'fee_status']);

        if ($students->isEmpty()) {
            $this->info('No unpaid students with a Telegram ID found.');

            return self::SUCCESS;
        }

        $sent = 0;
        $dryRun = $this->option('dry-run');

        foreach ($students as $student) {
            $latestUnpaid = $student->feeCharges
                ->where('status', 'unpaid')
                ->sortByDesc('billing_month')
                ->first();

            $month = $latestUnpaid
                ? \Carbon\Carbon::parse($latestUnpaid->billing_month)->format('F Y')
                : now()->format('F Y');

            $amount = $latestUnpaid ? (float) $latestUnpaid->amount : (float) $student->monthly_fee;

            $message = $telegram->feeReminderMessage($student->name_en, $month, $amount);

            if ($dryRun) {
                $this->line("--- [{$student->name_en}] → {$student->parent_telegram_id} ---");
                $this->line($message);
                $this->newLine();
            } else {
                SendTelegramMessage::dispatch($student->parent_telegram_id, $message);
            }

            $sent++;
        }

        $action = $dryRun ? 'Would send' : 'Queued';
        $this->info("{$action} fee reminders to {$sent} parent(s).");

        return self::SUCCESS;
    }
}
