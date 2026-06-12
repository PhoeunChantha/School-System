<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Models\SmsCommunication;
use App\Services\Backends\SmsCommunicationService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SmsCommunicationController extends Controller
{
    public function __construct(
        private readonly SmsCommunicationService $smsCommunicationService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/sms-communications/index', $this->smsCommunicationService->indexData());
    }

    public function retry(SmsCommunication $smsCommunication): RedirectResponse
    {
        try {
            $this->smsCommunicationService->retry($smsCommunication);

            return back()->with('success', 'SMS sent successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->withErrors(['sms' => $exception->getMessage()]);
        }
    }
}
