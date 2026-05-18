<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\UpdateSchoolSettingRequest;
use App\Http\Requests\Backends\UploadSchoolImageRequest;
use App\Services\Backends\SchoolSettingService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;
use Throwable;

class SchoolSettingController extends Controller
{
    /**
     * @var SchoolSettingService
     */
    public $schoolSettingService;

    public function __construct(SchoolSettingService $schoolSettingService)
    {
        $this->schoolSettingService = $schoolSettingService;
    }

    public function index(Request $request): Response
    {
        return Inertia::render('admin/settings/index', array_merge(
            $this->schoolSettingService->indexData(),
            [
                'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
                'profileStatus' => $request->session()->get('status'),
                'twoFactorEnabled' => (bool) ($request->user()?->two_factor_secret),
                'requiresConfirmation' => Features::optionEnabled(Features::twoFactorAuthentication(), 'confirm'),
            ],
        ));
    }

    public function update(UpdateSchoolSettingRequest $request, string $group): RedirectResponse
    {
        try {
            $this->schoolSettingService->update($group, $request->validated('value'), $request->user()?->id);

            return to_route('admin.settings')->with('success', 'Settings saved successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to save settings. Please try again.');
        }
    }

    public function uploadImage(UploadSchoolImageRequest $request): RedirectResponse
    {
        try {
            $this->schoolSettingService->uploadImage(
                $request->validated('type'),
                $request->file('image'),
                $request->user()?->id,
            );

            return back()->with('success', ucfirst($request->validated('type')).' uploaded successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to upload image. Please try again.');
        }
    }
}
