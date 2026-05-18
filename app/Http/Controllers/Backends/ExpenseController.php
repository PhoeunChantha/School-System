<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreExpenseCategoryRequest;
use App\Http\Requests\Backends\StoreExpenseRequest;
use App\Http\Requests\Backends\UpdateExpenseCategoryRequest;
use App\Http\Requests\Backends\UpdateExpenseRequest;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Services\Backends\ExpenseService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ExpenseController extends Controller
{
    public function __construct(public ExpenseService $expenseService) {}

    public function index(): Response
    {
        return Inertia::render('admin/expenses/index', $this->expenseService->indexData());
    }

    // --- Categories ---

    public function storeCategory(StoreExpenseCategoryRequest $request): RedirectResponse
    {
        try {
            $this->expenseService->createCategory($request->validated(), $request->user()?->id);

            return back()->with('success', 'Category created successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to create category. Please try again.');
        }
    }

    public function updateCategory(UpdateExpenseCategoryRequest $request, ExpenseCategory $expenseCategory): RedirectResponse
    {
        try {
            $this->expenseService->updateCategory($expenseCategory, $request->validated(), $request->user()?->id);

            return back()->with('success', 'Category updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update category. Please try again.');
        }
    }

    public function destroyCategory(ExpenseCategory $expenseCategory): RedirectResponse
    {
        try {
            $this->expenseService->deleteCategory($expenseCategory);

            return back()->with('success', 'Category deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete category. Please try again.');
        }
    }

    // --- Expenses ---

    public function store(StoreExpenseRequest $request): RedirectResponse
    {
        try {
            $this->expenseService->createExpense($request->validated(), $request->user()?->id);

            return back()->with('success', 'Expense recorded successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to record expense. Please try again.');
        }
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): RedirectResponse
    {
        try {
            $this->expenseService->updateExpense($expense, $request->validated(), $request->user()?->id);

            return back()->with('success', 'Expense updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update expense. Please try again.');
        }
    }

    public function destroy(Expense $expense): RedirectResponse
    {
        try {
            $this->expenseService->deleteExpense($expense);

            return back()->with('success', 'Expense deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete expense. Please try again.');
        }
    }
}
