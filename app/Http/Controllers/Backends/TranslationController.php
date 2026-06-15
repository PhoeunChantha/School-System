<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreTranslationRequest;
use App\Http\Requests\Backends\UpdateTranslationRequest;
use App\Services\Backends\TranslationFileService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TranslationController extends Controller
{
    public function __construct(private readonly TranslationFileService $translationFileService) {}

    public function index(): Response
    {
        return Inertia::render('admin/translations/index', $this->translationFileService->indexData());
    }

    public function store(StoreTranslationRequest $request): RedirectResponse
    {
        $this->translationFileService->create($request->validated());

        return to_route('admin.translations')->with('success', 'Translation created successfully.');
    }

    public function update(UpdateTranslationRequest $request, string $group, string $key): RedirectResponse
    {
        $this->translationFileService->update($group, $key, $request->validated());

        return to_route('admin.translations')->with('success', 'Translation updated successfully.');
    }

    public function destroy(string $group, string $key): RedirectResponse
    {
        $this->translationFileService->delete($group, $key);

        return to_route('admin.translations')->with('success', 'Translation deleted successfully.');
    }
}
