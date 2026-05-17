<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    private string $token;

    private string $baseUrl;

    public function __construct()
    {
        $this->token = config('services.telegram.bot_token', '');
        $this->baseUrl = "https://api.telegram.org/bot{$this->token}";
    }

    /**
     * Send a plain-text message to a Telegram chat.
     *
     * @param  string  $chatId  Numeric Telegram chat ID (from parent's /start handshake)
     */
    public function send(string $chatId, string $message): bool
    {
        if (empty($this->token)) {
            Log::warning('TelegramService: TELEGRAM_BOT_TOKEN is not set.');

            return false;
        }

        try {
            $response = Http::timeout(10)->post("{$this->baseUrl}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'HTML',
            ]);

            if (! $response->successful()) {
                Log::warning('TelegramService: failed to send message.', [
                    'chat_id' => $chatId,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('TelegramService: exception sending message.', [
                'chat_id' => $chatId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Render a fee reminder message for a parent.
     */
    public function feeReminderMessage(string $studentName, string $month, float $amount): string
    {
        return implode("\n", [
            "📚 <b>Frania English School</b>",
            "",
            "Dear Parent,",
            "",
            "This is a friendly reminder that the school fee for <b>{$studentName}</b> is still outstanding.",
            "",
            "🗓 Month: <b>{$month}</b>",
            "💵 Amount: <b>\${$amount}</b>",
            "",
            "Please contact the school to arrange payment.",
            "Thank you! 🙏",
        ]);
    }

    /**
     * Render a low-attendance alert message for a parent.
     */
    public function attendanceAlertMessage(string $studentName, int $attendanceRate): string
    {
        return implode("\n", [
            "📚 <b>Frania English School</b>",
            "",
            "Dear Parent,",
            "",
            "We would like to inform you that <b>{$studentName}</b>'s attendance has dropped below our required level.",
            "",
            "📊 Current Attendance: <b>{$attendanceRate}%</b>",
            "",
            "Please encourage your child to attend regularly.",
            "If you have any concerns, please contact the school. 🙏",
        ]);
    }

    /**
     * Render a grade notification message for a parent.
     */
    public function gradeNotificationMessage(string $studentName, string $period, int $average): string
    {
        $emoji = $average >= 75 ? '🌟' : ($average >= 50 ? '📖' : '⚠️');

        return implode("\n", [
            "📚 <b>Frania English School</b>",
            "",
            "Dear Parent,",
            "",
            "New grades have been recorded for <b>{$studentName}</b>.",
            "",
            "📝 Period: <b>{$period}</b>",
            "{$emoji} Average Score: <b>{$average}/100</b>",
            "",
            "Please contact the school if you have any questions. 🙏",
        ]);
    }

    /**
     * Check whether the bot token is configured.
     */
    public function isConfigured(): bool
    {
        return ! empty($this->token);
    }
}
