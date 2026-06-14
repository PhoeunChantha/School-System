<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreAppInstallationRequest;
use App\Models\AppInstallationLink;
use App\Services\Backends\AppInstallationService;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AppInstallationController extends Controller
{
    public function __construct(private readonly AppInstallationService $service) {}

    public function index(Request $request): InertiaResponse
    {
        return Inertia::render('admin/app-installations/index', $this->service->indexData($request));
    }

    public function store(StoreAppInstallationRequest $request): RedirectResponse
    {
        $this->service->generate($request->validated(), $request->user(), $request);

        return back()->with('success', 'Installation links generated.');
    }

    public function qr(Request $request, AppInstallationLink $appInstallationLink): Response
    {
        $svg = (new Writer(new ImageRenderer(new RendererStyle(360, 2), new SvgImageBackEnd)))
            ->writeString($request->root().route('app-install.show', ['token' => $appInstallationLink->token], false));
        $disposition = $request->boolean('download') ? 'attachment; filename="school-app-qr.svg"' : 'inline';

        return response($svg, 200, ['Content-Type' => 'image/svg+xml', 'Content-Disposition' => $disposition]);
    }

    public function regenerate(Request $request, AppInstallationLink $appInstallationLink): RedirectResponse
    {
        $this->service->regenerate($appInstallationLink, $request->user(), $request);

        return back()->with('success', 'Installation link regenerated.');
    }

    public function revoke(Request $request, AppInstallationLink $appInstallationLink): RedirectResponse
    {
        $this->service->revoke($appInstallationLink, $request->user(), $request);

        return back()->with('success', 'Installation link revoked.');
    }
}
