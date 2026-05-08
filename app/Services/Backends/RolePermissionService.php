<?php

namespace App\Services\Backends;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionService
{
    /**
     * @return array{roles: mixed, permissions: mixed, permissionGroups: mixed, summary: array<string, int>}
     */
    public function indexData(): array
    {
        $permissions = Permission::query()
            ->withCount('roles')
            ->orderBy('name')
            ->get()
            ->map(fn (Permission $permission): array => $this->permissionPayload($permission));

        $roles = Role::query()
            ->with('permissions:id,name')
            ->withCount('users')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role): array => $this->rolePayload($role));

        return [
            'roles' => $roles,
            'permissions' => $permissions,
            'permissionGroups' => $this->permissionGroups($permissions),
            'summary' => [
                'roleCount' => $roles->count(),
                'permissionCount' => $permissions->count(),
                'assignedPermissionCount' => $roles->sum(fn (array $role): int => count($role['permissionIds'])),
                'userRoleCount' => $roles->sum('userCount'),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createRole(array $data): Role
    {
        return DB::transaction(function () use ($data): Role {
            $role = Role::create([
                'name' => $data['name'],
                'guard_name' => $data['guard_name'] ?? 'web',
            ]);

            $role->syncPermissions($this->permissionNames($data['permission_ids'] ?? []));
            $this->forgetPermissionCache();

            return $role->refresh();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateRole(Role $role, array $data): Role
    {
        return DB::transaction(function () use ($role, $data): Role {
            $role->update([
                'name' => $data['name'],
                'guard_name' => $data['guard_name'] ?? 'web',
            ]);

            $role->syncPermissions($this->permissionNames($data['permission_ids'] ?? []));
            $this->forgetPermissionCache();

            return $role->refresh();
        });
    }

    public function deleteRole(Role $role): void
    {
        DB::transaction(function () use ($role): void {
            $role->delete();
            $this->forgetPermissionCache();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createPermission(array $data): Permission
    {
        return DB::transaction(function () use ($data): Permission {
            $permission = Permission::create([
                'name' => $data['name'],
                'guard_name' => $data['guard_name'] ?? 'web',
            ]);

            $this->forgetPermissionCache();

            return $permission->refresh();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updatePermission(Permission $permission, array $data): Permission
    {
        return DB::transaction(function () use ($permission, $data): Permission {
            $permission->update([
                'name' => $data['name'],
                'guard_name' => $data['guard_name'] ?? 'web',
            ]);

            $this->forgetPermissionCache();

            return $permission->refresh();
        });
    }

    public function deletePermission(Permission $permission): void
    {
        DB::transaction(function () use ($permission): void {
            $permission->delete();
            $this->forgetPermissionCache();
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function rolePayload(Role $role): array
    {
        return [
            'id' => $role->id,
            'name' => $role->name,
            'guardName' => $role->guard_name,
            'permissionIds' => $role->permissions->pluck('id')->values()->all(),
            'permissionNames' => $role->permissions->pluck('name')->values()->all(),
            'userCount' => $role->users_count,
            'createdAt' => $role->created_at?->format('Y-m-d') ?? '',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function permissionPayload(Permission $permission): array
    {
        return [
            'id' => $permission->id,
            'name' => $permission->name,
            'guardName' => $permission->guard_name,
            'group' => str($permission->name)->before('.')->toString(),
            'roleCount' => $permission->roles_count,
            'createdAt' => $permission->created_at?->format('Y-m-d') ?? '',
        ];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $permissions
     * @return array<int, array{name: string, permissions: array<int, array<string, mixed>>}>
     */
    private function permissionGroups(Collection $permissions): array
    {
        return $permissions
            ->groupBy('group')
            ->map(fn (Collection $groupPermissions, string $group): array => [
                'name' => $group,
                'permissions' => $groupPermissions->values()->all(),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<int, int|string>  $permissionIds
     * @return array<int, string>
     */
    private function permissionNames(array $permissionIds): array
    {
        return Permission::query()
            ->whereIn('id', $permissionIds)
            ->orderBy('name')
            ->pluck('name')
            ->all();
    }

    private function forgetPermissionCache(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
