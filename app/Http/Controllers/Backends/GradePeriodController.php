<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreGradePeriodRequest;
use App\Http\Requests\Backends\UpdateGradePeriodRequest;
use App\Models\GradePeriod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class GradePeriodController extends Controller
{
    public function index(): Response
    {
        $periods = GradePeriod::query()
            ->withCount('gradeRecords')
            ->orderByDesc('is_current')
            ->latest('starts_on')
            ->latest('id')
            ->get()
            ->map(fn (GradePeriod $period): array => $this->periodPayload($period));

        return Inertia::render('admin/grade-periods/index', [
            'periods' => $periods,
            'summary' => [
                'total' => $periods->count(),
                'monthly' => $periods->where('type', 'monthly')->count(),
                'term' => $periods->where('type', 'term')->count(),
                'final' => $periods->where('type', 'final')->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/grade-periods/create', [
            'defaults' => $this->currentMonthDefaults(),
        ]);
    }

    public function edit(GradePeriod $gradePeriod): Response
    {
        return Inertia::render('admin/grade-periods/edit', [
            'period' => $this->periodPayload($gradePeriod->loadCount('gradeRecords')),
        ]);
    }

    public function store(StoreGradePeriodRequest $request): RedirectResponse
    {
        try {
            DB::transaction(function () use ($request): void {
                $data = $request->validated();

                if ((bool) ($data['is_current'] ?? false)) {
                    GradePeriod::query()->update(['is_current' => false]);
                }

                GradePeriod::query()->create([
                    ...$data,
                    'is_current' => (bool) ($data['is_current'] ?? false),
                    'created_by' => $request->user()?->id,
                    'updated_by' => $request->user()?->id,
                ]);
            });

            return to_route('admin.grade-periods')->with('success', 'Grade period saved successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to save grade period. Please try again.');
        }
    }

    public function update(UpdateGradePeriodRequest $request, GradePeriod $gradePeriod): RedirectResponse
    {
        try {
            DB::transaction(function () use ($request, $gradePeriod): void {
                $data = $request->validated();

                if ((bool) ($data['is_current'] ?? false)) {
                    GradePeriod::query()
                        ->whereKeyNot($gradePeriod->id)
                        ->update(['is_current' => false]);
                }

                $gradePeriod->update([
                    ...$data,
                    'is_current' => (bool) ($data['is_current'] ?? false),
                    'updated_by' => $request->user()?->id,
                ]);
            });

            return to_route('admin.grade-periods')->with('success', 'Grade period updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update grade period. Please try again.');
        }
    }

    public function destroy(GradePeriod $gradePeriod): RedirectResponse
    {
        if ($gradePeriod->gradeRecords()->exists()) {
            return back()->with('error', 'This period has grade records and cannot be deleted.');
        }

        try {
            $gradePeriod->delete();

            return to_route('admin.grade-periods')->with('success', 'Grade period deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete grade period. Please try again.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function periodPayload(GradePeriod $period): array
    {
        return [
            'id' => $period->id,
            'routeKey' => $period->getRouteKey(),
            'name' => $period->name,
            'type' => $period->type,
            'academicYear' => $period->academic_year ?? '',
            'startsOn' => $period->starts_on?->format('Y-m-d') ?? '',
            'endsOn' => $period->ends_on?->format('Y-m-d') ?? '',
            'isCurrent' => $period->is_current,
            'recordCount' => $period->grade_records_count ?? 0,
        ];
    }

    /**
     * @return array{name: string, type: string, academic_year: string, starts_on: string, ends_on: string, is_current: bool}
     */
    private function currentMonthDefaults(): array
    {
        $start = now()->startOfMonth();
        $end = now()->endOfMonth();

        return [
            'name' => $start->format('F Y'),
            'type' => 'monthly',
            'academic_year' => $start->format('Y'),
            'starts_on' => $start->format('Y-m-d'),
            'ends_on' => $end->format('Y-m-d'),
            'is_current' => true,
        ];
    }
}
