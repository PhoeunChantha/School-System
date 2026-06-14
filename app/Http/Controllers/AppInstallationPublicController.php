<?php

namespace App\Http\Controllers;

use App\Http\Requests\TrackAppInstallationRequest;
use App\Services\AppInstallationTracker;
use App\Support\SchoolProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppInstallationPublicController extends Controller
{
    public function __construct(
        private readonly AppInstallationTracker $tracker,
        private readonly SchoolProfile $schoolProfile,
    ) {}

    public function show(Request $request, string $token): Response
    {
        $link = $this->tracker->findUsable($token);
        abort_if($link === null, 410, 'This installation link is invalid, expired, or revoked.');

        $this->tracker->record($link, 'opened', $request);
        $this->tracker->remember($request, $link);

        return Inertia::render('app-install/index', [
            'school' => $this->schoolProfile->data(),
            'recipient' => $link->student->name_en ?: $link->student->name_kh,
            'audience' => $link->audience,
            'expiresAt' => $link->expires_at->toIso8601String(),
            'manifestUrl' => route('school-app.manifest', ['installation' => $token]),
            'trackUrl' => route('app-install.track', ['token' => $token]),
            'launchUrl' => route('school-app.launch', ['installation' => $token]),
        ]);
    }

    public function track(TrackAppInstallationRequest $request, string $token): JsonResponse
    {
        $link = $this->tracker->findUsable($token);
        abort_if($link === null, 410);

        $data = $request->validated();
        $this->tracker->record($link, $data['event'], $request, $data);
        $this->tracker->remember($request, $link);

        return response()->json(['tracked' => true]);
    }

    public function launch(Request $request): Response
    {
        $token = $request->string('installation')->toString();

        if ($token !== '' && ($link = $this->tracker->findUsable($token)) !== null) {
            $this->tracker->remember($request, $link);
            $this->tracker->confirmPending($request);
        }

        $target = match (true) {
            $request->session()->has('parent_access_phone') => route('parent.dashboard'),
            $request->user()?->hasRole('student') === true => route('student.dashboard'),
            $request->user() !== null => url('/dashboard'),
            default => url('/'),
        };

        return Inertia::render('app-install/launcher', [
            'trackUrl' => $token !== '' ? route('app-install.track', ['token' => $token]) : null,
            'targetUrl' => $target,
        ]);
    }
}
