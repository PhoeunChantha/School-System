<?php

namespace App\Services\Backends;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ExpenseService
{
    /**
     * @return array{expenses: mixed, categories: mixed, summary: array<string, mixed>}
     */
    public function indexData(): array
    {
        $expenses = Expense::query()
            ->with('category:id,name,name_kh,color')
            ->latest('expense_date')
            ->latest('id')
            ->get()
            ->map(fn (Expense $expense): array => $this->expensePayload($expense));

        $categories = ExpenseCategory::query()
            ->withCount('expenses')
            ->withSum('expenses', 'amount')
            ->orderBy('name')
            ->get()
            ->map(fn (ExpenseCategory $cat): array => $this->categoryPayload($cat));

        return [
            'expenses' => $expenses,
            'categories' => $categories,
            'summary' => [
                'totalAmount' => (float) Expense::query()->sum('amount'),
                'totalCount' => Expense::query()->count(),
                'thisMonthAmount' => (float) Expense::query()
                    ->whereRaw("DATE_FORMAT(expense_date, '%Y-%m') = ?", [now()->format('Y-m')])
                    ->sum('amount'),
                'categoryCount' => ExpenseCategory::query()->count(),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createCategory(array $data, ?int $userId): ExpenseCategory
    {
        return DB::transaction(fn (): ExpenseCategory => ExpenseCategory::create([
            'name' => $data['name'],
            'name_kh' => $data['name_kh'] ?? null,
            'color' => $data['color'] ?? '#6366f1',
            'created_by' => $userId,
            'updated_by' => $userId,
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateCategory(ExpenseCategory $category, array $data, ?int $userId): ExpenseCategory
    {
        return DB::transaction(function () use ($category, $data, $userId): ExpenseCategory {
            $category->update([
                'name' => $data['name'],
                'name_kh' => $data['name_kh'] ?? null,
                'color' => $data['color'] ?? $category->color,
                'updated_by' => $userId,
            ]);

            return $category->refresh();
        });
    }

    public function deleteCategory(ExpenseCategory $category): void
    {
        DB::transaction(fn (): ?bool => $category->delete());
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createExpense(array $data, ?int $userId): Expense
    {
        return DB::transaction(fn (): Expense => Expense::create([
            ...$this->normalizedData($data),
            'created_by' => $userId,
            'updated_by' => $userId,
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateExpense(Expense $expense, array $data, ?int $userId): Expense
    {
        return DB::transaction(function () use ($expense, $data, $userId): Expense {
            $expense->update([
                ...$this->normalizedData($data),
                'updated_by' => $userId,
            ]);

            return $expense->refresh();
        });
    }

    public function deleteExpense(Expense $expense): void
    {
        DB::transaction(function () use ($expense): void {
            if ($expense->receipt) {
                Storage::disk('public')->delete($expense->receipt);
            }
            $expense->delete();
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function expensePayload(Expense $expense): array
    {
        return [
            'id' => $expense->id,
            'routeKey' => $expense->routeKey(),
            'title' => $expense->title,
            'amount' => (float) $expense->amount,
            'expenseDate' => $expense->expense_date?->format('Y-m-d') ?? '',
            'description' => $expense->description ?? '',
            'receipt' => $expense->receipt ? asset('storage/'.$expense->receipt) : null,
            'categoryId' => $expense->category_id,
            'categoryName' => $expense->category?->name ?? '',
            'categoryNameKh' => $expense->category?->name_kh ?? '',
            'categoryColor' => $expense->category?->color ?? '#6366f1',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function categoryPayload(ExpenseCategory $cat): array
    {
        return [
            'id' => $cat->id,
            'routeKey' => $cat->routeKey(),
            'name' => $cat->name,
            'nameKh' => $cat->name_kh ?? '',
            'color' => $cat->color,
            'expensesCount' => $cat->expenses_count ?? 0,
            'totalAmount' => (float) ($cat->expenses_sum_amount ?? 0),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizedData(array $data): array
    {
        return [
            'category_id' => $data['category_id'] ?? null,
            'title' => $data['title'],
            'amount' => $data['amount'],
            'expense_date' => $data['expense_date'],
            'description' => $data['description'] ?? null,
            'receipt' => $data['receipt'] ?? null,
        ];
    }
}
