<?php

namespace App\Services\Backends;

use App\Models\Level;
use Illuminate\Support\Facades\DB;

class LevelService
{
    /**
     * @return array{levels: mixed}
     */
    public function indexData(): array
    {
        return [
            'levels' => Level::query()
                ->withCount('students')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->map(fn (Level $level): array => [
                    'id'          => $level->id,
                    'name'        => $level->name,
                    'monthlyFee'  => (float) $level->monthly_fee,
                    'sortOrder'   => $level->sort_order,
                    'isActive'    => $level->is_active,
                    'studentCount' => $level->students_count,
                ]),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): Level
    {
        return DB::transaction(fn (): Level => Level::create([
            'name'        => $data['name'],
            'monthly_fee' => $data['monthly_fee'],
            'sort_order'  => $data['sort_order'] ?? 0,
            'is_active'   => $data['is_active'] ?? true,
            'created_by'  => $userId,
            'updated_by'  => $userId,
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Level $level, array $data, ?int $userId): Level
    {
        return DB::transaction(function () use ($level, $data, $userId): Level {
            $level->update([
                'name'        => $data['name'],
                'monthly_fee' => $data['monthly_fee'],
                'sort_order'  => $data['sort_order'] ?? 0,
                'is_active'   => $data['is_active'] ?? true,
                'updated_by'  => $userId,
            ]);

            return $level->refresh();
        });
    }

    public function delete(Level $level, ?int $userId): void
    {
        DB::transaction(function () use ($level, $userId): void {
            $level->update(['updated_by' => $userId]);
            $level->delete();
        });
    }
}
