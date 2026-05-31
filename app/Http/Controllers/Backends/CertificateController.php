<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreCertificateRequest;
use App\Http\Requests\Backends\StoreCertificateTemplateRequest;
use App\Http\Requests\Backends\UpdateCertificateRequest;
use App\Http\Requests\Backends\UpdateCertificateTemplateRequest;
use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Services\Backends\CertificateService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class CertificateController extends Controller
{
    /**
     * @var CertificateService
     */
    public $certificateService;

    public function __construct(CertificateService $certificateService)
    {
        $this->certificateService = $certificateService;
    }

    public function index(): Response
    {
        return Inertia::render('admin/certs/index', $this->certificateService->indexData());
    }

    public function create(): Response
    {
        return Inertia::render('admin/certs/create', $this->certificateService->formData());
    }

    public function createTemplate(): Response
    {
        return Inertia::render('admin/certs/templates/create');
    }

    public function store(StoreCertificateRequest $request): RedirectResponse
    {
        try {
            $this->certificateService->create($request->validated(), $request->user()?->id);

            return to_route('admin.certs')->with('success', 'Certificate saved successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to save certificate. Please try again.');
        }
    }

    public function update(UpdateCertificateRequest $request, Certificate $certificate): RedirectResponse
    {
        try {
            $this->certificateService->update($certificate, $request->validated(), $request->user()?->id);

            return to_route('admin.certs')->with('success', 'Certificate updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update certificate. Please try again.');
        }
    }

    public function storeTemplate(StoreCertificateTemplateRequest $request): RedirectResponse
    {
        try {
            $this->certificateService->createTemplate($request->validated(), $request->user()?->id);

            return to_route('admin.certs')->with('success', 'Certificate template saved successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to save certificate template. Please try again.');
        }
    }

    public function updateTemplate(UpdateCertificateTemplateRequest $request, CertificateTemplate $certificateTemplate): RedirectResponse
    {
        try {
            $this->certificateService->updateTemplate($certificateTemplate, $request->validated(), $request->user()?->id);

            return to_route('admin.certs')->with('success', 'Certificate template updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update certificate template. Please try again.');
        }
    }

    public function destroyTemplate(CertificateTemplate $certificateTemplate): RedirectResponse
    {
        try {
            $this->certificateService->deleteTemplate($certificateTemplate);

            return to_route('admin.certs')->with('success', 'Certificate template deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete certificate template. Please try again.');
        }
    }

    public function destroy(Certificate $certificate): RedirectResponse
    {
        try {
            $this->certificateService->delete($certificate);

            return to_route('admin.certs')->with('success', 'Certificate deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete certificate. Please try again.');
        }
    }
}
