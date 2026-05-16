<?php

namespace App\Services\Backends;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class UserService
{
    /**
     * @return array{users: mixed, roles: mixed, summary: array<string, int>}
     */
    public function indexData(): array
    {
        $users = User::query()
            ->with('roles:id,name')
            ->withCount('roles')
            ->latest('id')
            ->get()
            ->map(fn (User $user): array => $this->userPayload($user));

        return [
            'users' => $users,
            'roles' => Role::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Role $role): array => [
                    'id' => $role->id,
                    'name' => $role->name,
                ]),
            'summary' => [
                'userCount' => $users->count(),
                'verifiedCount' => $users->where('emailVerified', true)->count(),
                'roleAssignmentCount' => $users->sum(fn (array $user): int => count($user['roleIds'])),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): User
    {
        $avatarPath = $this->storeAvatar($data['avatar'] ?? null);

        return DB::transaction(function () use ($data, $avatarPath): User {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'avatar' => $avatarPath,
                'email_verified_at' => ($data['email_verified'] ?? false) ? now() : null,
            ]);

            $user->syncRoles($this->roleNames($data['role_ids'] ?? []));

            return $user->refresh();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $user, array $data): User
    {
        $avatarPath = $user->avatar;

        if (($data['avatar'] ?? null) instanceof UploadedFile) {
            $this->deleteAvatar($user->avatar);
            $avatarPath = $this->storeAvatar($data['avatar']);
        }

        return DB::transaction(function () use ($user, $data, $avatarPath): User {
            $attributes = [
                'name' => $data['name'],
                'email' => $data['email'],
                'avatar' => $avatarPath,
                'email_verified_at' => ($data['email_verified'] ?? false) ? ($user->email_verified_at ?? now()) : null,
            ];

            if (! empty($data['password'])) {
                $attributes['password'] = Hash::make($data['password']);
            }

            $user->update($attributes);
            $user->syncRoles($this->roleNames($data['role_ids'] ?? []));

            return $user->refresh();
        });
    }

    public function delete(User $user): void
    {
        DB::transaction(function () use ($user): void {
            $this->deleteAvatar($user->avatar);
            $user->delete();
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'routeKey' => $user->routeKey(),
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar ? asset($user->avatar) : null,
            'emailVerified' => $user->email_verified_at !== null,
            'roleIds' => $user->roles->pluck('id')->values()->all(),
            'roleNames' => $user->roles->pluck('name')->values()->all(),
            'createdAt' => $user->created_at?->format('Y-m-d') ?? '',
        ];
    }

    private function storeAvatar(?UploadedFile $file): ?string
    {
        if (! $file) {
            return null;
        }

        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $destination = public_path('uploads/users');

        if (! is_dir($destination)) {
            mkdir($destination, 0755, true);
        }

        $file->move($destination, $filename);

        return 'uploads/users/'.$filename;
    }

    private function deleteAvatar(?string $path): void
    {
        if ($path && file_exists(public_path($path))) {
            unlink(public_path($path));
        }
    }

    /**
     * @param  array<int, int|string>  $roleIds
     * @return array<int, string>
     */
    private function roleNames(array $roleIds): array
    {
        return Role::query()
            ->whereIn('id', $roleIds)
            ->orderBy('name')
            ->pluck('name')
            ->all();
    }
}
