<?php

namespace App\Exceptions;

use Exception;

class PlasGateSmsException extends Exception
{
    public function __construct(
        string $message,
        public readonly ?int $statusCode = null,
        public readonly ?string $responseBody = null,
    ) {
        parent::__construct($message);
    }
}
