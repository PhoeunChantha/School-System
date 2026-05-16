<?php

namespace App\Http\Controllers\Backends;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backends\StoreUserRequest;
use App\Http\Requests\Backends\UpdateUserRequest;
use App\Models\User;
use App\Services\Backends\UserService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class UserController extends Controller
{
    public function __construct(private UserService $userService) {}

    public function index(): Response
    {
        return Inertia::render('admin/users/index', $this->userService->indexData());
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        try {
            $this->userService->create($request->validated());

            return back()->with('success', 'User created successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to create user. Please try again.');
        }
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        try {
            $this->userService->update($user, $request->validated());

            return back()->with('success', 'User updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to update user. Please try again.');
        }
    }

    public function destroy(User $user): RedirectResponse
    {
        if (request()->user()?->is($user)) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        try {
            $this->userService->delete($user);

            return back()->with('success', 'User deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to delete user. Please try again.');
        }
    }
}
