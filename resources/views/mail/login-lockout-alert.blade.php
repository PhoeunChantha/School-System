<x-mail::message>
# Login Lockout Alert

Someone exceeded the failed login attempt limit.

<x-mail::panel>
Identifier: {{ $details['identifier'] }}

IP Address: {{ $details['ip'] }}

Locked For: {{ $details['availableIn'] }} seconds

Time: {{ $details['occurredAt'] }}
</x-mail::panel>

User Agent:

{{ $details['userAgent'] }}
</x-mail::message>
