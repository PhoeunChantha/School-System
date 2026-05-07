<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreFeeChargeRequest;
use App\Http\Requests\Backends\StorePaymentRequest;
use App\Http\Requests\Backends\UpdateFeeChargeRequest;
use App\Models\FeeCharge;
use App\Services\Backends\FeeChargeService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class FeeChargeController extends Controller
{
    /**
     * @var FeeChargeService
     */
    public $feeChargeService;

    public function __construct(FeeChargeService $feeChargeService)
    {
        $this->feeChargeService = $feeChargeService;
    }

    public function index(): Response
    {
        return Inertia::render('admin/fee/index', $this->feeChargeService->indexData());
    }

    public function create(): Response
    {
        return Inertia::render('admin/fee/create', $this->feeChargeService->createData());
    }

    public function store(StoreFeeChargeRequest $request): RedirectResponse
    {
        try {
            $this->feeChargeService->create($request->validated(), $request->user()?->id);

            return to_route('admin.fee')->with('success', 'Fee charge created successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to create fee charge. Please try again.');
        }
    }

    public function edit(FeeCharge $feeCharge): Response
    {
        return Inertia::render('admin/fee/edit', $this->feeChargeService->editData($feeCharge));
    }

    public function update(UpdateFeeChargeRequest $request, FeeCharge $feeCharge): RedirectResponse
    {
        try {
            $this->feeChargeService->update($feeCharge, $request->validated(), $request->user()?->id);

            return to_route('admin.fee')->with('success', 'Fee charge updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update fee charge. Please try again.');
        }
    }

    public function destroy(FeeCharge $feeCharge): RedirectResponse
    {
        try {
            $this->feeChargeService->delete($feeCharge);

            return to_route('admin.fee')->with('success', 'Fee charge deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete fee charge. Please try again.');
        }
    }

    public function payment(StorePaymentRequest $request, FeeCharge $feeCharge): RedirectResponse
    {
        try {
            $this->feeChargeService->recordPayment($feeCharge, $request->validated(), $request->user()?->id);

            return to_route('admin.fee')->with('success', 'Payment recorded successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to record payment. Please try again.');
        }
    }
}
