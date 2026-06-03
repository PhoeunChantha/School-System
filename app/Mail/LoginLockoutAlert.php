<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoginLockoutAlert extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array{identifier: string, ip: string, userAgent: string, availableIn: int, occurredAt: string}  $details
     */
    public function __construct(public array $details) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Login Lockout Alert',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'mail.login-lockout-alert',
            with: [
                'details' => $this->details,
            ],
        );
    }
}
