<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StorePermissionRequest;
use App\Http\Requests\Backends\StoreRoleRequest;
use App\Http\Requests\Backends\UpdatePermissionRequest;
use App\Http\Requests\Backends\UpdateRoleRequest;
use App\Services\Backends\RolePermissionService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Throwable;

class RolePermissionController extends Controller
{
    public function __construct(private RolePermissionService $rolePermissionService) {}

    public function index(): Response
    {
        return Inertia::render('admin/roles-permissions/index', $this->rolePermissionService->indexData());
    }

    public function storeRole(StoreRoleRequest $request): RedirectResponse
    {
        try {
            $this->rolePermissionService->createRole($request->validated());

            return back()->with('success', 'Role created successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to create role. Please try again.');
        }
    }

    public function updateRole(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        try {
            $this->rolePermissionService->updateRole($role, $request->validated());

            return back()->with('success', 'Role updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update role. Please try again.');
        }
    }

    public function destroyRole(Role $role): RedirectResponse
    {
        try {
            $this->rolePermissionService->deleteRole($role);

            return back()->with('success', 'Role deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete role. Please try again.');
        }
    }

    public function storePermission(StorePermissionRequest $request): RedirectResponse
    {
        try {
            $this->rolePermissionService->createPermission($request->validated());

            return back()->with('success', 'Permission created successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to create permission. Please try again.');
        }
    }

    public function updatePermission(UpdatePermissionRequest $request, Permission $permission): RedirectResponse
    {
        try {
            $this->rolePermissionService->updatePermission($permission, $request->validated());

            return back()->with('success', 'Permission updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update permission. Please try again.');
        }
    }

    public function destroyPermission(Permission $permission): RedirectResponse
    {
        try {
            $this->rolePermissionService->deletePermission($permission);

            return back()->with('success', 'Permission deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete permission. Please try again.');
        }
    }
}
